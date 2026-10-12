const mongoose = require('mongoose');

// Live MongoDB Atlas Cloud database URI (pre-configured so reviewers/interviewers can run out-of-the-box)
const ATLAS_MONGO_URI =
  'mongodb+srv://trialfor681_db_user:test2233%21@cluster0.sqqubw3.mongodb.net/employee_project_mgmt?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || ATLAS_MONGO_URI;

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`MongoDB connected: ${conn.connection.host} (Live Atlas Cloud)`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
