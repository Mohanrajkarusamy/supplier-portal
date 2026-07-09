import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendServerEmail } from '@/lib/emailServer';
import { sendServerSMS } from '@/lib/smsServer';

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
      const supplier = await User.findOne({ id, role: 'SUPPLIER_USER' });
      if (!supplier) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
      return NextResponse.json(supplier);
  }

  const suppliers = await User.find({ role: 'SUPPLIER_USER' });
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Validate manual Supplier ID
    if (!body.id || !body.id.trim()) {
        return NextResponse.json({ success: false, message: 'Supplier Code (User ID) is required.' }, { status: 400 });
    }
    body.id = body.id.trim();

    const existingUser = await User.findOne({ id: body.id });
    if (existingUser) {
        return NextResponse.json({ success: false, message: `Supplier Code (User ID) '${body.id}' already exists.` }, { status: 400 });
    }

    // Auto-generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const supplierData = {
        ...body,
        password: hashedPassword,
        role: 'SUPPLIER_USER',
        status: 'Pending Activation'
    };

    const newSupplier = await User.create(supplierData);

    // Notification Logic (Real Email & SMS)
    const smsMessage = `SAKTHI Partner Hub: Your Supplier ID is ${body.id} and Temporary Password is ${tempPassword}. Activate at https://supplier-portal-kappa.vercel.app/auth/register`;

    const emailSubject = `SAKTHI Partner Hub - Welcome & Credentials`;
    const emailBody = `Dear Partner,\n\nWelcome to SAKTHI Partner Hub! Your account has been registered.\n\nYour login credentials are:\n- Supplier ID: ${body.id}\n- Temporary Password: ${tempPassword}\n\nPlease activate your account by setting a new password here:\nhttps://supplier-portal-kappa.vercel.app/auth/register\n\nBest regards,\nSAKTHI Partner Hub Admin`;

    // Send Email
    const emailRes = await sendServerEmail(body.email, emailSubject, emailBody);

    // Send SMS
    let smsRes: { success: boolean; isSimulation?: boolean } = { success: true, isSimulation: true };
    if (body.phone) {
      smsRes = await sendServerSMS(body.phone, smsMessage);
    }

    console.log(`[CREDENTIALS] Created Supplier ${body.id}. Email Sent: ${emailRes.success}, SMS Sent: ${smsRes.success}`);

    return NextResponse.json({ 
        success: true, 
        supplier: newSupplier,
        _debug_tempPassword: tempPassword // For dev visibility
    });
  } catch (error) {
    console.error("Supplier creation error:", error);
    return NextResponse.json({ success: false, message: 'Creation failed', error }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...updateData } = body;

    const updatednodes = await User.findOneAndUpdate({ id }, updateData, { new: true });
    return NextResponse.json({ success: true, supplier: updatednodes });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Update failed', error }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await User.findOneAndDelete({ id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Delete failed', error }, { status: 500 });
  }
}
