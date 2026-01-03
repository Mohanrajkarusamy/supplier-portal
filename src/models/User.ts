import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true }, // e.g., SUP001, ADMIN01
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'SUPPLIER'], required: true },
  email: { type: String, required: true },
  phone: { type: String },
  password: { type: String }, // Can be empty for Pending Activation
  status: { type: String, enum: ['Active', 'Pending Activation', 'Inactive'], default: 'Active' },
  companyDetails: {
    address: { type: String },
    category: { type: String, enum: ['Pre-Machining', 'Child-Part'] },
    operationType: { type: String },
    approvedParts: [{ 
        name: { type: String },
        partNumber: { type: String }
    }]
  }
}, { timestamps: true });

// Prevent overwrite of existing model during hot reload
const User = models.User || model('User', UserSchema);

export default User;
