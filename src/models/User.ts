import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true }, // e.g., SUP001, ADMIN01
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'SQA_ADMIN', 'SUPPLIER_USER'], 
    required: true 
  },
  email: { type: String, required: true },
  phone: { type: String },
  password: { type: String },
  status: { 
    type: String, 
    enum: ['Active', 'Pending Activation', 'Inactive', 'Locked'], 
    default: 'Pending Activation' 
  },
  
  // Registration Fields
  supplierCode: { type: String },
  category: { type: String, enum: ['Pre-Machining', 'Child-Part'] },
  address: { type: String },
  contactPerson: { type: String },
  gstNumber: { type: String },
  panNumber: { type: String },
  
  // Security & Audit
  passwordExpiry: { type: Date },
  failedAttempts: { type: Number, default: 0 },
  lastLogin: { type: Date },
  otpCode: { type: String },
  otpExpiry: { type: Date },
  
  companyDetails: {
    operationType: { type: String },
    approvedParts: [{ 
        name: { type: String },
        partNumber: { type: String },
        productionLine: { type: String },
        productCode: { type: String },
        debitAllowance: { type: Number, default: 0 },
        monthlyRequirement: { type: Number, default: 0 },
        safetyStockLevel: { type: Number, default: 0 },
        shiftScheme: { type: String, enum: ['2-shifts', '3-shifts'], default: '3-shifts' },
        shiftTargets: {
            shiftA: { type: Number, default: 0 },
            shiftB: { type: Number, default: 0 },
            shiftC: { type: Number, default: 0 }
        }
    }]
  }
}, { timestamps: true });

// Prevent overwrite of existing model during hot reload
const User = models.User || model('User', UserSchema);

export default User;
