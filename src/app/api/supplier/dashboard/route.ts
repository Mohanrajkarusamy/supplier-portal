import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Performance from '@/models/Performance';
import Issue from '@/models/Issue';
import DebitNote from '@/models/DebitNote';
import Production from '@/models/Production';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');

    if (!supplierId) {
        return NextResponse.json({ success: false, message: 'Supplier ID required' }, { status: 400 });
    }

    const performance = await Performance.find({ supplierId }).sort({ month: -1 });
    const issues = await Issue.find({ supplierId, status: { $ne: 'Closed' } });
    const debitNotes = await DebitNote.find({ supplierId, status: { $ne: 'Paid' } });

    // Fetch inventory stats from Production logs
    const logs = await Production.find({ supplierId }).sort({ date: 1 });
    
    // Get date bounds
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
    
    const latestRecord = logs.length > 0 ? logs[logs.length - 1] : null;
    const currentStock = latestRecord ? latestRecord.closingStock : 0;
    
    const todayRecord = logs.find(l => l.date === todayStr);
    const productionToday = todayRecord ? todayRecord.production : 0;
    const dispatchToday = todayRecord ? todayRecord.dispatch : 0;
    const rejectionToday = todayRecord ? todayRecord.rejection : 0;
    
    const monthlyLogs = logs.filter(l => l.date.startsWith(currentMonthStr));
    const totalProductionMonth = monthlyLogs.reduce((sum, l) => sum + (l.production || 0), 0);
    const totalDispatchMonth = monthlyLogs.reduce((sum, l) => sum + (l.dispatch || 0), 0);
    const totalRejectionMonth = monthlyLogs.reduce((sum, l) => sum + (l.rejection || 0), 0);
    
    // Find the opening stock for the current month
    // Either from a monthly opening stock record, or the earliest record of this month
    const firstOfMonthLog = monthlyLogs[0];
    const openingStockMonth = firstOfMonthLog ? (firstOfMonthLog.isOpeningStockRecord ? firstOfMonthLog.openingStock : firstOfMonthLog.openingStock) : 0;

    // Fetch requirements and safety stocks from User profile
    const user = await User.findOne({ id: supplierId });
    let totalMonthlyRequirement = 0;
    let safetyStockLevel = 0;
    let partsList = [];
    
    if (user && user.companyDetails && user.companyDetails.approvedParts) {
      partsList = user.companyDetails.approvedParts;
      for (const part of user.companyDetails.approvedParts) {
        totalMonthlyRequirement += part.monthlyRequirement || 0;
        safetyStockLevel += part.safetyStockLevel || 0;
      }
    }

    const pendingRequirement = Math.max(0, totalMonthlyRequirement - totalProductionMonth);

    return NextResponse.json({
        success: true,
        performance,
        openIssues: issues.length,
        pendingDebitNotes: debitNotes.length,
        latestRating: performance[0]?.grade || 'N/A',
        currentPPM: performance[0]?.ppm || 0,
        
        // Inventory Metrics
        inventory: {
          currentStock,
          safetyStockLevel,
          pendingRequirement,
          openingStock: openingStockMonth,
          productionToday,
          dispatchToday,
          rejectionToday,
          monthlyProduction: totalProductionMonth,
          monthlyDispatch: totalDispatchMonth,
          monthlyRejection: totalRejectionMonth,
          parts: partsList
        }
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json({ success: false, message: 'Fetch failed', error }, { status: 500 });
  }
}
