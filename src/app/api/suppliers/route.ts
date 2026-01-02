import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
      const supplier = await User.findOne({ id, role: 'SUPPLIER' });
      if (!supplier) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
      return NextResponse.json(supplier);
  }

  const suppliers = await User.find({ role: 'SUPPLIER' });
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Check duplication
    const existing = await User.findOne({ id: body.id });
    if (existing) return NextResponse.json({ success: false, message: 'ID already exists' }, { status: 400 });

    if (body.password) {
        body.password = await bcrypt.hash(body.password, 10);
    }

    const newSupplier = await User.create(body);
    return NextResponse.json({ success: true, supplier: newSupplier });
  } catch (error) {
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
