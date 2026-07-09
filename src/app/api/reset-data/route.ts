import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Production from '@/models/Production';
import Requisition from '@/models/Requisition';
import Document from '@/models/Document';
import Issue from '@/models/Issue';
import DebitNote from '@/models/DebitNote';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    
    // Delete all transactional records to start fresh
    const prodRes = await Production.deleteMany({});
    const reqRes = await Requisition.deleteMany({});
    const docRes = await Document.deleteMany({});
    const issueRes = await Issue.deleteMany({});
    const debitRes = await DebitNote.deleteMany({});
    const userRes = await User.deleteMany({ role: 'SUPPLIER_USER' });
    
    return NextResponse.json({
      success: true,
      message: 'All transactional ledger data and supplier accounts reset successfully.',
      deletedCounts: {
        productionLogs: prodRes.deletedCount,
        requisitions: reqRes.deletedCount,
        documents: docRes.deletedCount,
        qualityIssues: issueRes.deletedCount,
        debitNotes: debitRes.deletedCount,
        supplierAccounts: userRes.deletedCount
      }
    });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json({ success: false, error: error.message || error }, { status: 500 });
  }
}
