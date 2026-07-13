import mongoose, { Schema, model, models } from 'mongoose';

const PerformanceSchema = new Schema({
  supplierId: { type: String, required: true },
  month: { type: String, required: true }, // YYYY-MM
  
  qualityScore: { type: Number, default: 0 }, // 60%
  deliveryScore: { type: Number, default: 0 }, // 20%
  responsivenessScore: { type: Number, default: 0 }, // 10%
  auditScore: { type: Number, default: 0 }, // 10%
  
  totalScore: { type: Number, required: true },
  grade: { type: String, required: true },
  
  isRedStatus: { type: Boolean, default: false },
  redStatusReason: { type: String },
  
  ppm: { type: Number, default: 0 },
  otd: { type: Number, default: 0 },
  
  // E-Sign Approvals
  qualitySignedBy: { type: String, default: "" },
  qualitySignedAt: { type: Date },
  deliverySignedBy: { type: String, default: "" },
  deliverySignedAt: { type: Date },
  managementSignedBy: { type: String, default: "" },
  managementSignedAt: { type: Date }
}, { timestamps: true });

const Performance = models.Performance || model('Performance', PerformanceSchema);

export default Performance;
