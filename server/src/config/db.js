const mongoose = require('mongoose');
const env = require('./env');

let mongoServer = null;

const connectDB = async () => {
  try {
    let uri = env.MONGO_URI;

    if (!uri) {
      console.log('ℹ️  No MONGO_URI provided. Initializing in-memory MongoDB fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log(`✅ In-Memory MongoDB running at: ${uri}`);
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ Connected to MongoDB (${env.MONGO_URI ? 'Remote/Local' : 'In-Memory'})`);
  } catch (error) {
    console.error(`⚠️ MongoDB connection error with URI (${env.MONGO_URI}): ${error.message}`);
    // If remote connection failed, fallback to in-memory
    if (env.MONGO_URI && !mongoServer) {
      console.log('🔄 Attempting fallback to in-memory MongoDB...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log(`✅ Connected to fallback In-Memory MongoDB at: ${uri}`);
        return;
      } catch (fallbackError) {
        console.error('❌ Failed to launch in-memory MongoDB fallback:', fallbackError.message);
        process.exit(1);
      }
    }
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error disconnecting DB:', error);
  }
};

module.exports = { connectDB, disconnectDB };
