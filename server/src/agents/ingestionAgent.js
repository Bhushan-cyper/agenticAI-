const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const Notification = require('../models/Notification');
const chunkingService = require('../services/chunkingService');
const embeddingService = require('../services/embeddingService');
const { getVectorStore } = require('../config/vectorStore');
const { emitDocumentStatus, emitNotification } = require('../config/socket');

class IngestionAgent {
  /**
   * Run OCR fallback on image or scanned PDF using Tesseract.js
   */
  async _runOcrFallback(filePath) {
    try {
      console.log(`🔍 Running Tesseract OCR fallback for: ${filePath}`);
      const Tesseract = require('tesseract.js');
      const { data } = await Tesseract.recognize(filePath, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && m.progress % 0.25 === 0) {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
          }
        },
      });
      return data.text || '';
    } catch (err) {
      console.warn(`OCR fallback failed: ${err.message}`);
      return '';
    }
  }

  /**
   * Extract text and pages from file (PDF or text file)
   */
  async extractText(filePath, mimeType) {
    const pages = [];
    let isOcrProcessed = false;

    if (mimeType === 'text/plain' || filePath.endsWith('.txt') || filePath.endsWith('.md')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      pages.push({ pageNumber: 1, text: content });
      return { pages, isOcrProcessed, pageCount: 1 };
    }

    // PDF extraction
    try {
      const dataBuffer = fs.readFileSync(filePath);
      
      // pdf-parse provides custom pager render function
      let pageIndex = 1;
      const parsed = await pdfParse(dataBuffer, {
        pagerender: function (pageData) {
          return pageData.getTextContent().then(function (textContent) {
            let lastY, text = '';
            for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            pages.push({ pageNumber: pageIndex++, text });
            return text;
          });
        },
      });

      const totalExtractedLength = pages.reduce((acc, p) => acc + p.text.trim().length, 0);

      // If extracted text is empty or suspiciously low, trigger OCR fallback
      if (totalExtractedLength < 50) {
        console.log('⚠️ PDF text extraction yielded <50 characters. Triggering OCR fallback...');
        const ocrText = await this._runOcrFallback(filePath);
        if (ocrText && ocrText.trim().length > 0) {
          isOcrProcessed = true;
          return {
            pages: [{ pageNumber: 1, text: ocrText }],
            isOcrProcessed: true,
            pageCount: 1,
          };
        }
      }

      return {
        pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: parsed.text || '' }],
        isOcrProcessed,
        pageCount: parsed.numpages || pages.length || 1,
      };
    } catch (err) {
      console.error(`PDF parse error: ${err.message}. Trying OCR fallback...`);
      const ocrText = await this._runOcrFallback(filePath);
      if (ocrText && ocrText.trim().length > 0) {
        return {
          pages: [{ pageNumber: 1, text: ocrText }],
          isOcrProcessed: true,
          pageCount: 1,
        };
      }
      throw new Error(`Text extraction failed: ${err.message}`);
    }
  }

  /**
   * Process a document through the entire ingestion pipeline
   */
  async processDocument(documentId) {
    const doc = await Document.findById(documentId);
    if (!doc) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    try {
      // 1. EXTRACTING
      doc.status = 'EXTRACTING';
      doc.errorReason = null;
      await doc.save();
      emitDocumentStatus(doc._id, 'EXTRACTING', { title: doc.title });

      let extractionResult;
      try {
        extractionResult = await this.extractText(doc.storagePath, doc.mimeType);
      } catch (extractErr) {
        doc.status = 'FAILED';
        doc.errorReason = 'EXTRACTION_FAILED: ' + extractErr.message;
        await doc.save();
        emitDocumentStatus(doc._id, 'FAILED', { error: doc.errorReason });
        return doc;
      }

      doc.pageCount = extractionResult.pageCount;
      doc.isOcrProcessed = extractionResult.isOcrProcessed;

      // 2. CHUNKING
      doc.status = 'CHUNKING';
      await doc.save();
      emitDocumentStatus(doc._id, 'CHUNKING', { title: doc.title, pageCount: doc.pageCount });

      const rawChunks = chunkingService.chunkDocumentPages(extractionResult.pages);
      if (!rawChunks || rawChunks.length === 0) {
        doc.status = 'FAILED';
        doc.errorReason = 'CHUNKING_FAILED: Document produced zero text chunks';
        await doc.save();
        emitDocumentStatus(doc._id, 'FAILED', { error: doc.errorReason });
        return doc;
      }

      doc.chunkCount = rawChunks.length;

      // 3. EMBEDDING
      doc.status = 'EMBEDDING';
      await doc.save();
      emitDocumentStatus(doc._id, 'EMBEDDING', { title: doc.title, chunkCount: rawChunks.length });

      // Clean existing chunks & vectors before upsert (re-indexing protection)
      await Chunk.deleteMany({ documentId: doc._id });
      const vectorStore = getVectorStore();
      await vectorStore.deleteByDocumentId(doc._id);

      const chunkTexts = rawChunks.map((c) => c.text);
      let embeddings = [];
      try {
        embeddings = await embeddingService.embedDocuments(chunkTexts);
      } catch (embErr) {
        doc.status = 'FAILED';
        doc.errorReason = 'EMBEDDING_FAILED: ' + embErr.message;
        await doc.save();
        emitDocumentStatus(doc._id, 'FAILED', { error: doc.errorReason });
        return doc;
      }

      // 4. VECTOR STORE & MONGO WRITER
      const vectorsToUpsert = [];
      const chunkDocsToSave = [];
      const modelName = embeddingService.getEmbeddingModelName();

      for (let i = 0; i < rawChunks.length; i++) {
        const rc = rawChunks[i];
        const vectorId = `doc_${doc._id}_chunk_${rc.chunkIndex}`;
        const embeddingValues = embeddings[i] || [];

        chunkDocsToSave.push({
          documentId: doc._id,
          pageNumber: rc.pageNumber,
          chunkIndex: rc.chunkIndex,
          text: rc.text,
          vectorId,
          embeddingModel: modelName,
          metadata: {
            documentTitle: doc.title,
            department: doc.department,
            collectionTag: doc.collectionTag,
            charLength: rc.charLength,
            tokenEstimate: rc.tokenEstimate,
          },
        });

        vectorsToUpsert.push({
          id: vectorId,
          values: embeddingValues,
          metadata: {
            documentId: String(doc._id),
            documentTitle: doc.title,
            department: doc.department,
            collectionTag: doc.collectionTag,
            pageNumber: rc.pageNumber,
            chunkIndex: rc.chunkIndex,
            text: rc.text,
          },
        });
      }

      // Save Chunks in Mongo
      const savedChunks = await Chunk.insertMany(chunkDocsToSave);

      // Save in Vector Store
      try {
        await vectorStore.upsert(vectorsToUpsert);
      } catch (vecErr) {
        doc.status = 'FAILED';
        doc.errorReason = 'VECTOR_STORE_FAILED: ' + vecErr.message;
        await doc.save();
        emitDocumentStatus(doc._id, 'FAILED', { error: doc.errorReason });
        return doc;
      }

      // 5. INDEXED SUCCESS
      doc.status = 'INDEXED';
      doc.errorReason = null;
      await doc.save();
      emitDocumentStatus(doc._id, 'INDEXED', {
        title: doc.title,
        chunkCount: savedChunks.length,
        pageCount: doc.pageCount,
      });

      // Emit Notification for Admin
      const notification = await Notification.create({
        owner: doc.owner,
        documentId: doc._id,
        type: 'INGESTION_SUCCESS',
        title: 'Document Indexed Successfully',
        message: `"${doc.title}" has been processed into ${savedChunks.length} chunks and indexed.`,
      });
      emitNotification(notification);

      return doc;
    } catch (unexpectedErr) {
      console.error('Unexpected error in IngestionAgent:', unexpectedErr);
      doc.status = 'FAILED';
      doc.errorReason = 'UNEXPECTED_ERROR: ' + unexpectedErr.message;
      await doc.save();
      emitDocumentStatus(doc._id, 'FAILED', { error: doc.errorReason });
      return doc;
    }
  }
}

module.exports = new IngestionAgent();
