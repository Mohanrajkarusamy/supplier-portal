import mongoose, { Schema, model, models } from 'mongoose';

const DebitNoteSchema = new Schema({
  id: { type: String, required: true, unique: true }, // e.g., DN-2024-001
  supplierId: { type: String, required: true },
  partNumber: { type: String, required: true },
  date: { type: String, required: true },
  
  rejectionQuantity: { type: Number, required: true },
  allowancePercentage: { type: Number, default: 0 },
  recoveryRate: { type: Number, required: true },
  
  receivedQuantity: { type: Number, default: 0 },
  allowanceQuantity: { type: Number, default: 0 },
  exceedQuantity: { type: Number, default: 0 },
  
  sortingCost: { type: Number, default: 0 },
  reworkCost: { type: Number, default: 0 },
  transportationCost: { type: Number, default: 0 },
  
  debitAmount: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Sent', 'Paid'], default: 'Draft' }
}, { timestamps: true });

const DebitNote = models.DebitNote || model('DebitNote', DebitNoteSchema);

export default DebitNote;
