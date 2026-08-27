const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { errorHandler } = require('./middlewares/errorMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const server = http.createServer(app);

// 1. Security & Dynamic CORS Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const allowedOriginRegex = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/,
  /^https:\/\/([a-zA-Z0-9_-]+\.)*onrender\.com$/,
];

const checkCorsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  
  if (env.CLIENT_URL) {
    const cleanClientUrl = env.CLIENT_URL.trim().replace(/\/+$/, '');
    if (origin === cleanClientUrl || origin.startsWith(cleanClientUrl)) {
      return callback(null, true);
    }
  }

  const isMatch = allowedOriginRegex.some((regex) => regex.test(origin));
  if (isMatch || env.CLIENT_URL === '*' || env.NODE_ENV !== 'production') {
    return callback(null, true);
  }

  return callback(null, true);
};

app.use(cors({
  origin: checkCorsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 2. Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { success: false, message: 'Rate limit exceeded for chat queries. Please slow down.' },
});

// 3. Static directory for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 4. API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// 5. Initialize Socket.IO & Start Server
const startServer = async () => {
  try {
    await connectDB();
    initSocket(server, env.CLIENT_URL);

    // Auto-seed if database has no users (especially for in-memory MongoDB)
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Empty database detected. Running automatic initial seed...');
      const { seedData } = require('./seed');
      // Run seed without calling process.exit
      const fs = require('fs');
      const Collection = require('./models/Collection');
      const Document = require('./models/Document');
      const ingestionAgent = require('./agents/ingestionAgent');

      const adminUser = await User.create({
        name: 'Campus Administrator',
        email: 'admin@campusmind.edu',
        password: 'Admin@123456',
        role: 'admin',
      });

      await User.create({
        name: 'Alex Johnson',
        email: 'student@campusmind.edu',
        password: 'Student@123456',
        role: 'student',
      });

      const collectionsToCreate = [
        { name: 'Admissions & Eligibility', department: 'Admissions', description: 'Undergraduate, postgraduate, entrance cutoffs, seat matrices, and application dates.', icon: 'GraduationCap' },
        { name: 'Tuition & Scholarships', department: 'Accounts', description: 'Semester fees, hostel charges, payment portals, and merit/need-based financial aid.', icon: 'Receipt' },
        { name: 'Hostel & Residential Life', department: 'Hostel', description: 'Hostel allocation, mess menu & timings, curfew hours, and security regulations.', icon: 'Building2' },
        { name: 'Placements & Internships', department: 'Placements', description: 'Company recruitment drives, salary packages, eligibility, and summer internships.', icon: 'Briefcase' },
        { name: 'Academic Calendar & Exams', department: 'Academics', description: 'Semester dates, mid-term/end-term exams, holiday schedules, and attendance rules.', icon: 'Calendar' },
        { name: 'Library, Clubs & Sports', department: 'Library', description: 'Library borrowing policies, student clubs, athletic facilities, and university health center.', icon: 'BookOpen' },
      ];

      const createdCols = await Collection.insertMany(collectionsToCreate);
      const colMap = {};
      createdCols.forEach((c) => { colMap[c.department] = c; });

      const sampleDocsDir = path.join(__dirname, '../data/sample_documents');
      const files = [
        { filename: 'Admissions_and_Eligibility_Guide_2025.txt', title: 'Admissions & Eligibility Guide 2025-2026', department: 'Admissions', collectionTag: 'Admissions & Eligibility' },
        { filename: 'Fee_Structure_and_Scholarships_Policy.txt', title: 'Fee Structure & Scholarships Policy', department: 'Accounts', collectionTag: 'Tuition & Scholarships' },
        { filename: 'Hostel_Mess_and_Campus_Rules.txt', title: 'Hostel, Mess & Residential Rules Handbook', department: 'Hostel', collectionTag: 'Hostel & Residential Life' },
        { filename: 'Placement_and_Internship_Brochure.txt', title: 'Placement & Internship Brochure 2024-2025', department: 'Placements', collectionTag: 'Placements & Internships' },
        { filename: 'Academic_Calendar_and_Examination_Rules.txt', title: 'Academic Calendar & Examination Rules 2025', department: 'Academics', collectionTag: 'Academic Calendar & Exams' },
        { filename: 'Library_Clubs_and_Campus_Facilities.txt', title: 'Central Library, Clubs & Sports Guide', department: 'Library', collectionTag: 'Library, Clubs & Sports' },
      ];

      for (const f of files) {
        const fp = path.join(sampleDocsDir, f.filename);
        if (fs.existsSync(fp)) {
          const stats = fs.statSync(fp);
          const doc = await Document.create({
            title: f.title,
            originalFilename: f.filename,
            storagePath: fp,
            mimeType: 'text/plain',
            fileSize: stats.size,
            owner: adminUser._id,
            department: f.department,
            collectionTag: f.collectionTag,
            status: 'UPLOADED',
          });
          await ingestionAgent.processDocument(doc._id);
          const col = colMap[f.department];
          if (col) {
            col.documentIds.push(doc._id);
            await col.save();
          }
        }
      }
      console.log('✅ Automatic initial seed complete!');
    }

    server.listen(env.PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`🎓 CampusMind AI Server Running on http://0.0.0.0:${env.PORT}`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
      console.log(`🔒 Security: Helmet, CORS, Rate-Limiting active`);
      console.log(`🤖 Active Providers:`, env.getProvidersStatus());
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start CampusMind server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };
