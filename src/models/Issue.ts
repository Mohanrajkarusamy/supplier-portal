import mongoose, { Schema, model, models } from 'mongoose';

const IssueSchema = new Schema({
  id: { type: String, required: true, unique: true },
  supplierId: { type: String, required: true },
  type: { type: String, required: true }, // NCR, Late Delivery
  description: { type: String, required: true },
  partName: { type: String },
  severity: { type: String, enum: ['Critical', 'Major', 'Minor'], required: true },
  raisedDate: { type: String, required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
  rootCause: { type: String },
  correctiveAction: { type: String },
  closedDate: { type: String }
}, { timestamps: true });

const Issue = models.Issue || model('Issue', IssueSchema);

export default Issue;
