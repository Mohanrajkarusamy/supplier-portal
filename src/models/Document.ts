import mongoose, { Schema, model, models } from 'mongoose';

const DocumentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  fileUrl: { type: String }, 
  details: { type: String }
}, { timestamps: true });

const Document = models.Document || model('Document', DocumentSchema);

export default Document;
