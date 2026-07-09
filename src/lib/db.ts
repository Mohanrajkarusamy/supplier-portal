import mongoose from 'mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

const MONGODB_URI = (process.env.MONGODB_URI || 'mongodb://localhost:27017/supplier-portal').trim();

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Global interface to add mongoose caching attached to global object
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function seedDatabase() {
  try {
    // 1. Ensure sqasakthi admin exists with correct credentials
    let adminUser = await User.findOne({ id: "sqasakthi" });
    const adminPassword = await bcrypt.hash('Password@123', 10);
    
    if (!adminUser) {
      console.log('Creating sqasakthi admin...');
      await User.create({
        id: "sqasakthi",
        name: "Sakthi Admin",
        email: "sqasakthi@gmail.com",
        role: "SUPER_ADMIN",
        password: adminPassword,
        status: "Active",
        passwordExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });
    } else {
      adminUser.email = "sqasakthi@gmail.com";
      await adminUser.save();
    }

    const userCount = await User.countDocuments();
    if (userCount <= 1) { // Only sqasakthi exists
      console.log('Seeding default supplier...');
      const supplierPassword = await bcrypt.hash('Password@123', 10);
      
      await User.create([
        {
          id: "SUP001",
          name: "Mohanraj Karusamy",
          email: "supplier@example.com",
          role: "SUPPLIER_USER",
          password: supplierPassword,
          status: "Active",
          category: "Pre-Machining",
          failedAttempts: 0,
          passwordExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          companyDetails: {
              category: "Pre-Machining",
              approvedParts: [
                  { name: "Engine Block A", partNumber: "EB-101" },
                  { name: "Cylinder Head B", partNumber: "CH-202" }
              ]
          }
        }
      ]);
      console.log('Database seeding completed successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      // Seed the database after successful connection
      await seedDatabase();
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
