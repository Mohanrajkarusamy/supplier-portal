import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SettingChange from '@/models/SettingChange';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const live = searchParams.get('live') === 'true';

    if (live) {
      // Find latest status for each line of the supplier(s)
      const query = supplierId ? { supplierId } : {};
      const changes = await SettingChange.find(query).sort({ timestamp: -1 });

      // Group by supplierId and line to find the latest running component
      const liveStatusMap: any = {};

      for (const change of changes) {
        const key = `${change.supplierId}_${change.line}`;
        if (!liveStatusMap[key]) {
          liveStatusMap[key] = {
            line: change.line,
            supplierId: change.supplierId,
            supplierName: change.supplierName,
            runningPart: change.toPart,
            changedAt: change.timestamp,
            date: change.date
          };
        }
      }

      return NextResponse.json(Object.values(liveStatusMap));
    }

    const query = supplierId ? { supplierId } : {};
    const history = await SettingChange.find(query).sort({ timestamp: -1 });
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { supplierId, line, fromPart, toPart } = body;

    if (!supplierId || !line || !fromPart || !toPart) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    let supplierName = 'Unknown Supplier';
    const user = await User.findOne({ id: supplierId });
    if (user) {
      supplierName = user.name;
    }

    const newChange = await SettingChange.create({
      id: `CHG${Date.now()}`,
      supplierId,
      supplierName,
      line,
      fromPart,
      toPart,
      date: new Date().toISOString().split('T')[0]
    });

    return NextResponse.json({ success: true, change: newChange });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message || error }, { status: 500 });
  }
}
