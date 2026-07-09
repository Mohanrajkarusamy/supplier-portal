import mongoose, { Schema, model, models } from 'mongoose';

const RequisitionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: [
      '4M Change report', 
      'CMS report', 
      'supplier audit report', 
      'ESG report', 
      'new assessment report'
    ],
    required: true 
  },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  partNumber: { type: String },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['Pending Upload', 'Uploaded'], default: 'Pending Upload' },
  fileUrl: { type: String }, // Base64 or URL for the audit report / requisition template
  remarks: { type: String }
}, { timestamps: true });

const Requisition = models.Requisition || model('Requisition', RequisitionSchema);

export default Requisition;
