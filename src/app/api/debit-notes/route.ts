import { NextResponse } from 'next/server';
import DebitNote from '@/models/DebitNote';
import connectDB from '@/lib/db';
import { Users, BarChart3, Upload, FileText, IndianRupee, GitPullRequest, Settings } from "lucide-react"

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const supplierId = searchParams.get('supplierId');
        
        let query = {};
        if (supplierId) {
            query = { supplierId };
        }
        
        const notes = await DebitNote.find(query).sort({ createdAt: -1 });
        return NextResponse.json(notes);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const data = await request.json();
        
        // Auto-ID if not provided
        if (!data.id) {
            const count = await DebitNote.countDocuments();
            data.id = `DN-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;
        }
        
        // Calculate debitAmount using exceedQuantity
        const exceed = data.exceedQuantity !== undefined ? data.exceedQuantity : Math.max(0, (data.rejectionQuantity || 0) - ((data.receivedQuantity || 0) * (data.allowancePercentage || 0) / 100));
        data.exceedQuantity = exceed;
        data.debitAmount = (exceed * (data.recoveryRate || 0)) + (data.sortingCost || 0) + (data.reworkCost || 0) + (data.transportationCost || 0);
        
        const newNote = await DebitNote.create(data);
        return NextResponse.json({ success: true, data: newNote });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await connectDB();
        const data = await request.json();
        const { id, status } = data;
        
        const updated = await DebitNote.findOneAndUpdate({ id }, { status }, { new: true });
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
