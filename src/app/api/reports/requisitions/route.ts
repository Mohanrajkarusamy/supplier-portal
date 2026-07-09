import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Requisition from '@/models/Requisition';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    
    const query = supplierId ? { supplierId } : {};
    const requisitions = await Requisition.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(requisitions);
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const formData = await request.formData();
    
    const type = formData.get('type') as string;
    const supplierId = formData.get('supplierId') as string;
    const partNumber = (formData.get('partNumber') as string) || 'N/A';
    const remarks = (formData.get('remarks') as string) || '';
    const date = formData.get('date') as string || new Date().toISOString().split('T')[0];
    const file = formData.get('file') as File | null;

    let supplierName = 'Unknown Supplier';
    const user = await User.findOne({ id: supplierId });
    if (user) {
      supplierName = user.name;
    }

    let fileUrl = '';
    let status = 'Pending Upload';

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString('base64');
      const mimeType = file.type || 'application/octet-stream';
      fileUrl = `data:${mimeType};base64,${base64Data}`;
      status = 'Uploaded';
    }

    const newReq = await Requisition.create({
      id: `REQ${Date.now()}`,
      type,
      supplierId,
      supplierName,
      partNumber,
      date,
      status,
      fileUrl,
      remarks
    });

    return NextResponse.json({ success: true, requisition: newReq });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message || error }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const file = formData.get('file') as File | null;

    if (!id || !file) {
      return NextResponse.json({ success: false, message: 'Missing requisition ID or file' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    const fileUrl = `data:${mimeType};base64,${base64Data}`;

    const updated = await Requisition.findOneAndUpdate(
      { id },
      { fileUrl, status: 'Uploaded' },
      { new: true }
    );

    return NextResponse.json({ success: true, requisition: updated });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message || error }, { status: 500 });
  }
}
