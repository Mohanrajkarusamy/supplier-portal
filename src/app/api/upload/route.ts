import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Production from '@/models/Production';
import Performance from '@/models/Performance';
import Issue from '@/models/Issue';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { type, data } = body; // type: 'production' | 'quality' | 'delivery'

    if (!Array.isArray(data)) {
        return NextResponse.json({ success: false, message: 'Invalid data format' }, { status: 400 });
    }

    let result;
    if (type === 'production') {
        result = await Production.insertMany(data);
    } else if (type === 'quality') {
        // Map to Issue model or similar
        const issues = data.map((d: any) => ({
            ...d,
            id: d.id || `QC-${Date.now()}-${Math.random().toString(36).slice(-4)}`
        }));
        result = await Issue.insertMany(issues);
    } else if (type === 'delivery') {
        // Update Performance records
        for (const item of data) {
            await Performance.findOneAndUpdate(
                { supplierId: item.supplierId, month: item.month },
                { $set: item },
                { upsert: true }
            );
        }
        result = { count: data.length };
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ success: false, message: 'Upload failed', error }, { status: 500 });
  }
}
