import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Document from '@/models/Document';
import { put } from '@vercel/blob';

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
    const supplierName = formData.get('supplierName') as string;
    const partName = formData.get('partName') as string;
    const date = formData.get('date') as string;
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '_')}`;
    
    const blob = await put(filename, file, {
      access: 'public',
    });

    const newDoc = await Document.create({
        id: `D${Date.now()}`,
        type,
        supplierId,
        supplierName,
        partName,
        date,
        status: 'Pending',
        fileUrl: blob.url
    });

    return NextResponse.json({ success: true, document: newDoc });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Upload failed', error }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
     await connectDB();
     const body = await request.json();
     const { id, status } = body;
     
     const updated = await Document.findOneAndUpdate({ id }, { status }, { new: true });
     return NextResponse.json({ success: true, document: updated });
  } catch (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
