import mongoose, { Schema, model, models } from 'mongoose';

const SortingLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true }, // Denormalized for query ease
  date: { type: String, required: true },
  partName: { type: String, required: true },
  totalQty: { type: Number, required: true },
  sortedQty: { type: Number, required: true }, // Same as total usually? Or subset.
  defectsFound: { type: Number, required: true },
  reworkedQty: { type: Number, required: true },
  okQty: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Validated', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

const SortingLog = models.SortingLog || model('SortingLog', SortingLogSchema);

export default SortingLog;
