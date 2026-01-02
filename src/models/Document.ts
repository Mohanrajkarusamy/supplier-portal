import mongoose, { Schema, model, models } from 'mongoose';

const DocumentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // PPAP, 8D Report, etc.
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  fileUrl: { type: String }, // Dummy URL for now
  details: { type: String } // Optional: part number, description
}, { timestamps: true });

const Document = models.Document || model('Document', DocumentSchema);

export default Document;
