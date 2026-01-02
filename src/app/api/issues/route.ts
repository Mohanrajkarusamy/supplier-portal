import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Issue from '@/models/Issue';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');

    const query = supplierId ? { supplierId } : {};
    const issues = await Issue.find(query);

    return NextResponse.json(issues);
  } catch(error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const newIssue = await Issue.create(body);
    return NextResponse.json({ success: true, issue: newIssue });
  } catch(error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...updateData } = body;

    const updated = await Issue.findOneAndUpdate({ id }, updateData, { new: true });
    return NextResponse.json({ success: true, issue: updated });
  } catch(error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
