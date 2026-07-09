import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Document from '@/models/Document';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    
    const query = supplierId ? { supplierId } : {};
    const docs = await Document.find(query);
    
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const formData = await request.formData();
    
    // Extract fields
    const type = formData.get('type') as string;
    const supplierId = formData.get('supplierId') as string;
    let supplierName = formData.get('supplierName') as string;
    const partName = formData.get('partName') as string;
    const date = formData.get('date') as string;
    const file = formData.get('file') as File | null;

    if (!supplierName && supplierId) {
      const user = await User.findOne({ id: supplierId });
      if (user) {
        supplierName = user.name;
      }
    }
    if (!supplierName) {
      supplierName = supplierId || "Unknown Supplier";
    }

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // Convert to base64 Data URL
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    const fileUrl = `data:${mimeType};base64,${base64Data}`;

    const newDoc = await Document.create({
        id: `D${Date.now()}`,
        type,
        supplierId,
        supplierName,
        partName,
        date,
        status: 'Pending',
        fileUrl: fileUrl
    });

    return NextResponse.json({ success: true, document: newDoc });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Upload failed', error: error.message || error }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
     await connectDB();
     const body = await request.json();
     const { id, status, remarks } = body;
     
     const updated = await Document.findOneAndUpdate({ id }, { status, details: remarks }, { new: true });
     return NextResponse.json({ success: true, document: updated });
  } catch (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
