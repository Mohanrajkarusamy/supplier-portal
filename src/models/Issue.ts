import mongoose, { Schema, model, models } from 'mongoose';

const IssueSchema = new Schema({
  id: { type: String, required: true, unique: true },
  concernNumber: { type: String, required: true }, // SAKTHI-QC-001
  supplierId: { type: String, required: true },
  type: { type: String, required: true }, // NCR, Late Delivery, Customer Complaint
  description: { type: String, required: true },
  partNumber: { type: String },
  quantity: { type: Number, default: 0 },
  defectReason: { type: String },
  severity: { type: String, enum: ['Critical', 'Major', 'Minor'], required: true },
  raisedDate: { type: String, required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
  rootCause: { type: String },
  correctiveAction: { type: String },
  closureStatus: { type: String },
  closedDate: { type: String }
}, { timestamps: true });

const Issue = models.Issue || model('Issue', IssueSchema);

export default Issue;
