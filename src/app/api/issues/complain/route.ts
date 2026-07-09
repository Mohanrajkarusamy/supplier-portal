import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Issue from '@/models/Issue';
import User from '@/models/User';
import { sendServerEmail } from '@/lib/emailServer';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      supplierId,
      partNumber,
      partName,
      complaintsCount,
      complaintDetails,
      message,
      raisedDate
    } = body;

    if (!supplierId || !raisedDate) {
      return NextResponse.json({ success: false, message: 'Missing supplierId or raisedDate' }, { status: 400 });
    }

    // 1. Fetch supplier's registered email
    const supplier = await User.findOne({ id: supplierId });
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    }

    const supplierEmail = supplier.email || 'mohanrajkarusamy@gmail.com';
    const supplierName = supplier.name || 'Supplier';

    // 2. Create Issue document
    const ncrId = `NCR-AUTO-${Date.now()}`;
    const concernNum = `SAKTHI-QC-${Date.now().toString().slice(-4)}`;
    
    const newIssue = await Issue.create({
      id: ncrId,
      concernNumber: concernNum,
      supplierId: supplierId,
      type: 'Customer Complaint',
      description: complaintDetails || 'Customer Complaint Logged via Performance',
      partNumber: partNumber || 'N/A',
      quantity: Number(complaintsCount) || 1,
      defectReason: complaintDetails || 'Customer Complaint',
      severity: 'Major',
      raisedDate: raisedDate,
      status: 'Open'
    });

    // 3. Dispatch real-time email
    const emailSubject = `[SAKTHI Partner Hub] New Customer Complaint Registered [${supplierId}]`;
    const emailBody = `Dear Team at ${supplierName},\n\nA customer complaint has been registered on the SAKTHI Partner Hub for your company.\n\n` +
      `Details:\n` +
      `- Part Name: ${partName || 'N/A'}\n` +
      `- Part Number: ${partNumber || 'N/A'}\n` +
      `- Date: ${raisedDate}\n` +
      `- Complaint Count: ${complaintsCount || 1}\n` +
      `- Description: ${complaintDetails || 'Customer Complaint'}\n\n` +
      `Message from SAKTHI Admin:\n` +
      `----------------------------------------\n` +
      `${message || 'Please review the complaint details and log in to submit your root cause and corrective action plan (RC-CA).'}\n` +
      `----------------------------------------\n\n` +
      `Please log in to your dashboard to review this concern and submit your corrective actions.\n\n` +
      `Best regards,\nSAKTHI Partner Hub Admin`;

    const emailList = [supplierEmail, 'sqa-admin@sakthiauto.com', 'purchase@sakthiauto.com'];
    for (const recipient of emailList) {
      try {
        await sendServerEmail(recipient, emailSubject, emailBody);
      } catch (err) {
        console.error(`Failed to send email to ${recipient}:`, err);
      }
    }

    return NextResponse.json({ success: true, issue: newIssue });
  } catch (error: any) {
    console.error("Complaint registration error:", error);
    return NextResponse.json({ success: false, message: 'Registration failed', error: error.message }, { status: 500 });
  }
}
