import mongoose, { Schema, model, models } from 'mongoose';

const SettingChangeSchema = new Schema({
  id: { type: String, required: true, unique: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  line: { type: String, enum: ['Line-1', 'Line-2', 'Line-3', 'Line-4', 'Line-5'], required: true },
  fromPart: { type: String, required: true },
  toPart: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const SettingChange = models.SettingChange || model('SettingChange', SettingChangeSchema);

export default SettingChange;
