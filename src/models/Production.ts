import mongoose, { Schema, model, models } from 'mongoose';

const ProductionSchema = new Schema({
  supplierId: { type: String, required: true },
  partNumber: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  
  productionLine: { type: String },
  shift: { type: String, default: 'N/A' }, // Shift A, Shift B, Shift C
  
  // Inventory Transaction Fields
  openingStock: { type: Number, default: 0 },
  production: { type: Number, default: 0 },
  rejection: { type: Number, default: 0 },
  dispatch: { type: Number, default: 0 },
  plannedQty: { type: Number, default: 0 },
  closingStock: { type: Number, default: 0 },
  castingIssued: { type: Number, default: 0 },
  
  remarks: { type: String },
  shortageReason: { type: String }, // e.g. Production Loss, Machine Breakdown, etc.
  
  isOpeningStockRecord: { type: Boolean, default: false },
  enteredBy: { type: String, enum: ['Admin', 'Supplier'], default: 'Supplier' }
}, { timestamps: true });

const Production = models.Production || model('Production', ProductionSchema);

export default Production;
