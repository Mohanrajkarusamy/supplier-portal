import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SortingLog from '@/models/SortingLog';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');

    const query = supplierId ? { supplierId } : {};
    const logs = await SortingLog.find(query);

    return NextResponse.json(logs);
  } catch(error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
      await connectDB();
      const body = await request.json();
      const newLog = await SortingLog.create(body);
      return NextResponse.json({ success: true, log: newLog });
    } catch(error) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
      await connectDB();
      const body = await request.json();
      const { id, status } = body;
  
      const updated = await SortingLog.findOneAndUpdate({ id }, { status }, { new: true });
      return NextResponse.json({ success: true, log: updated });
    } catch(error) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
  }
