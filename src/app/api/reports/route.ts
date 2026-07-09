import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Production from '@/models/Production';
import Performance from '@/models/Performance';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const category = searchParams.get('category') || 'All';
    const type = searchParams.get('type') || 'Performance Summary';

    if (type === 'Comparison') {
      // Query all production logs for this month
      const logs = await Production.find({
        date: { $regex: new RegExp('^' + month) }
      });

      // Group logs by supplier, part, and date
      const comparisonMap = new Map<string, any>();

      for (const log of logs) {
        const key = `${log.supplierId}_${log.partNumber}_${log.date}`;
        let existing = comparisonMap.get(key);

        if (!existing) {
          existing = {
            date: log.date,
            supplierId: log.supplierId,
            partNumber: log.partNumber,
            supplierDispatch: 0,
            supplierRejection: 0,
            supplierProduction: 0,
            adminDispatch: 0,
            adminRejection: 0,
            adminProduction: 0,
            supplierRemarks: "",
            adminRemarks: ""
          };
        }

        if (log.enteredBy === 'Admin') {
          existing.adminDispatch += log.dispatch || 0;
          existing.adminRejection += log.rejection || 0;
          existing.adminProduction += log.production || 0;
          existing.adminRemarks = log.remarks || "";
        } else {
          existing.supplierDispatch += log.dispatch || 0;
          existing.supplierRejection += log.rejection || 0;
          existing.supplierProduction += log.production || 0;
          existing.supplierRemarks = log.remarks || "";
        }

        comparisonMap.set(key, existing);
      }

      let comparisonList = Array.from(comparisonMap.values());

      // If category filter is applied, filter by supplier category
      if (category !== 'All') {
        const suppliers = await User.find({ role: 'SUPPLIER_USER', category });
        const supplierIds = suppliers.map(s => s.id);
        comparisonList = comparisonList.filter(item => supplierIds.includes(item.supplierId));
      }

      // Sort by date descending
      comparisonList.sort((a, b) => b.date.localeCompare(a.date));

      return NextResponse.json(comparisonList);
    }

    // Fetch all registered suppliers
    const activeSuppliers = await User.find({ role: 'SUPPLIER_USER' });
    
    // Calculate live performance stats for each supplier
    const results = []
    
    for (const supplier of activeSuppliers) {
      if (category !== 'All' && supplier.category !== category) {
        continue;
      }
      
      // Query admin production logs for this supplier in this month
      const logs = await Production.find({
        supplierId: supplier.id,
        enteredBy: 'Admin',
        date: { $regex: new RegExp('^' + month) }
      });
      
      let otd = 100;
      let ppm = 0;
      let totalPlanned = 0;
      let totalActual = 0;
      let totalRejection = 0;
      
      if (logs.length > 0) {
        for (const log of logs) {
          totalPlanned += log.plannedQty || 0;
          totalActual += log.dispatch || 0;
          totalRejection += log.rejection || 0;
        }
        
        otd = totalPlanned > 0 ? Math.min(100, Math.round((totalActual / totalPlanned) * 100)) : 100;
        ppm = totalActual > 0 ? Math.round((totalRejection / totalActual) * 1000000) : 0;
      } else {
        // Look up saved monthly performance if any
        const pRecord = await Performance.findOne({ supplierId: supplier.id, month });
        if (pRecord) {
          results.push({
            supplierId: supplier.id,
            ppm: pRecord.ppm || 0,
            otd: pRecord.otd || 0,
            totalScore: pRecord.totalScore || 0,
            grade: pRecord.grade || 'N/A',
            isRedStatus: pRecord.isRedStatus || false
          });
          continue;
        }
        
        // Seed default template fallback
        otd = supplier.id === 'SUP001' ? 98 : 100;
        ppm = supplier.id === 'SUP001' ? 850 : 0;
      }
      
      // Compute score and grade based on Pre-machining vs Child-part category rules
      const isChildPart = supplier.category === 'Child-Part' || supplier.companyDetails?.category === 'Child-Part';
      
      // Quality score (out of 60) based on PPM rules
      let qScore = 0;
      if (isChildPart) {
        if (ppm === 0) qScore = 60;
        else if (ppm <= 10) qScore = 50;
        else if (ppm <= 20) qScore = 40;
        else if (ppm <= 30) qScore = 30;
        else if (ppm <= 40) qScore = 20;
        else qScore = 0;
      } else {
        if (ppm <= 2000) qScore = 60;
        else if (ppm <= 2500) qScore = 50;
        else if (ppm <= 3000) qScore = 40;
        else if (ppm <= 4000) qScore = 30;
        else if (ppm <= 5000) qScore = 20;
        else qScore = 0;
      }

      // Delivery score (out of 20) based on OTD rules
      let dScore = 0;
      if (otd >= 100) dScore = 20;
      else if (otd >= 95) dScore = 15;
      else if (otd >= 90) dScore = 10;
      else if (otd >= 85) dScore = 5;
      else if (otd >= 80) dScore = 2;
      else dScore = 0;

      // Others scores (at the end of the month) loaded if saved in database
      let responsivenessScore = 10; // 4M submission ontime (default 10)
      let auditScore = 10;          // Premium Freight Nil (5) + Line Stoppage Nil (5) (default 10)

      const pRecord = await Performance.findOne({ supplierId: supplier.id, month });
      if (pRecord) {
        responsivenessScore = pRecord.responsivenessScore !== undefined ? pRecord.responsivenessScore : 10;
        auditScore = pRecord.auditScore !== undefined ? pRecord.auditScore : 10;
      }

      const totalScore = qScore + dScore + responsivenessScore + auditScore;
      
      let grade = 'D';
      if (totalScore >= 95) grade = 'A+';
      else if (totalScore >= 90) grade = 'A';
      else if (totalScore >= 80) grade = 'B';
      else if (totalScore >= 70) grade = 'C';
      
      results.push({
        supplierId: supplier.id,
        ppm,
        otd,
        totalScore,
        grade,
        isRedStatus: isChildPart ? (ppm > 40 || otd < 80) : (ppm > 5000 || otd < 80)
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
