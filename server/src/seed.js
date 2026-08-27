const fs = require('fs');
const path = require('path');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Collection = require('./models/Collection');
const Document = require('./models/Document');
const Chunk = require('./models/Chunk');
const ChatLog = require('./models/ChatLog');
const Conversation = require('./models/Conversation');
const Notification = require('./models/Notification');
const ingestionAgent = require('./agents/ingestionAgent');
const { getVectorStore } = require('./config/vectorStore');

const seedData = async () => {
  try {
    console.log('\n🌱 Starting CampusMind AI Seed Process...');
    await connectDB();

    // 1. Clear existing sample collections & records if needed
    console.log('🧹 Clearing previous demo seed data...');
    await User.deleteMany({});
    await Collection.deleteMany({});
    await Document.deleteMany({});
    await Chunk.deleteMany({});
    await ChatLog.deleteMany({});
    await Conversation.deleteMany({});
    await Notification.deleteMany({});

    const vectorStore = getVectorStore();
    try {
      await vectorStore.clear();
    } catch (e) {
      console.warn('Vector store clear note:', e.message);
    }

    // 2. Create Default Users
    console.log('👤 Creating demo accounts...');
    const adminUser = await User.create({
      name: 'Campus Administrator',
      email: 'admin@campusmind.edu',
      password: 'Admin@123456',
      role: 'admin',
    });

    const studentUser = await User.create({
      name: 'Alex Johnson',
      email: 'student@campusmind.edu',
      password: 'Student@123456',
      role: 'student',
    });

    console.log(`✅ Created Admin: admin@campusmind.edu / Admin@123456`);
    console.log(`✅ Created Student: student@campusmind.edu / Student@123456`);

    // 3. Create Default Department Collections
    console.log('📂 Creating department collections...');
    const collectionsToCreate = [
      {
        name: 'Admissions & Eligibility',
        department: 'Admissions',
        description: 'Undergraduate, postgraduate, entrance cutoffs, seat matrices, and application dates.',
        icon: 'GraduationCap',
      },
      {
        name: 'Tuition & Scholarships',
        department: 'Accounts',
        description: 'Semester fees, hostel charges, payment portals, and merit/need-based financial aid.',
        icon: 'Receipt',
      },
      {
        name: 'Hostel & Residential Life',
        department: 'Hostel',
        description: 'Hostel allocation, mess menu & timings, curfew hours, and security regulations.',
        icon: 'Building2',
      },
      {
        name: 'Placements & Internships',
        department: 'Placements',
        description: 'Company recruitment drives, salary packages, eligibility, and summer internships.',
        icon: 'Briefcase',
      },
      {
        name: 'Academic Calendar & Exams',
        department: 'Academics',
        description: 'Semester dates, mid-term/end-term exams, holiday schedules, and attendance rules.',
        icon: 'Calendar',
      },
      {
        name: 'Library, Clubs & Sports',
        department: 'Library',
        description: 'Library borrowing policies, student clubs, athletic facilities, and university health center.',
        icon: 'BookOpen',
      },
    ];

    const createdCollections = await Collection.insertMany(collectionsToCreate);
    const collectionMap = {};
    createdCollections.forEach((c) => {
      collectionMap[c.department] = c;
    });

    // 4. Ingest and Index Sample Documents
    console.log('📄 Ingesting campus handbook documents into RAG vector store...');
    const sampleDocsDir = path.join(__dirname, '../data/sample_documents');
    const files = [
      {
        filename: 'Admissions_and_Eligibility_Guide_2025.txt',
        title: 'Admissions & Eligibility Guide 2025-2026',
        department: 'Admissions',
        collectionTag: 'Admissions & Eligibility',
      },
      {
        filename: 'Fee_Structure_and_Scholarships_Policy.txt',
        title: 'Fee Structure & Scholarships Policy',
        department: 'Accounts',
        collectionTag: 'Tuition & Scholarships',
      },
      {
        filename: 'Hostel_Mess_and_Campus_Rules.txt',
        title: 'Hostel, Mess & Residential Rules Handbook',
        department: 'Hostel',
        collectionTag: 'Hostel & Residential Life',
      },
      {
        filename: 'Placement_and_Internship_Brochure.txt',
        title: 'Placement & Internship Brochure 2024-2025',
        department: 'Placements',
        collectionTag: 'Placements & Internships',
      },
      {
        filename: 'Academic_Calendar_and_Examination_Rules.txt',
        title: 'Academic Calendar & Examination Rules 2025',
        department: 'Academics',
        collectionTag: 'Academic Calendar & Exams',
      },
      {
        filename: 'Library_Clubs_and_Campus_Facilities.txt',
        title: 'Central Library, Clubs & Sports Guide',
        department: 'Library',
        collectionTag: 'Library, Clubs & Sports',
      },
    ];

    for (const fileInfo of files) {
      const filePath = path.join(sampleDocsDir, fileInfo.filename);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const doc = await Document.create({
          title: fileInfo.title,
          originalFilename: fileInfo.filename,
          storagePath: filePath,
          mimeType: 'text/plain',
          fileSize: stats.size,
          owner: adminUser._id,
          department: fileInfo.department,
          collectionTag: fileInfo.collectionTag,
          status: 'UPLOADED',
        });

        // Run full ingestion pipeline
        console.log(`⏳ Processing "${doc.title}"...`);
        await ingestionAgent.processDocument(doc._id);

        // Add document to respective collection
        const col = collectionMap[fileInfo.department];
        if (col) {
          col.documentIds.push(doc._id);
          await col.save();
        }
      }
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('------------------------------------------------------');
    console.log('Admin Account   : admin@campusmind.edu / Admin@123456');
    console.log('Student Account : student@campusmind.edu / Student@123456');
    console.log('Sample Docs     : 6 college handbooks indexed into vector store');
    console.log('------------------------------------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed process failed:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = { seedData };
