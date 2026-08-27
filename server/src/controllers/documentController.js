const documentService = require('../services/documentService');

class DocumentController {
  async getAll(req, res, next) {
    try {
      const { department, status } = req.query;
      const documents = await documentService.getAllDocuments({ department, status });
      res.status(200).json({
        success: true,
        count: documents.length,
        documents,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await documentService.getDocumentById(req.params.id);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No document file provided for upload',
        });
      }

      const { title, department, collectionTag } = req.body;
      const doc = await documentService.createDocument({
        title: title || req.file.originalname,
        file: req.file,
        ownerId: req.user._id,
        department: department || 'General',
        collectionTag: collectionTag || department || 'General',
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded and queued for processing',
        document: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const doc = await documentService.updateDocument(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Document updated successfully',
        document: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  async reindex(req, res, next) {
    try {
      const result = await documentService.reindexDocument(req.params.id);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await documentService.deleteDocument(req.params.id);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DocumentController();
