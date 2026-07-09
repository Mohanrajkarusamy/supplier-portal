import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Production from '@/models/Production';
import User from '@/models/User';
import { sendServerEmail } from '@/lib/emailServer';
import { sendServerSMS } from '@/lib/smsServer';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const partNumber = searchParams.get('partNumber');
    const enteredBy = searchParams.get('enteredBy');

    const query: any = {};
    if (supplierId) query.supplierId = supplierId;
    if (partNumber) query.partNumber = partNumber;
    if (enteredBy) query.enteredBy = enteredBy;

    const logs = await Production.find(query).sort({ date: -1 });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Fetch failed', error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      supplierId,
      partNumber,
      productionLine,
      shift = 'N/A',
      date,
      openingStock = 0,
      castingIssued = 0,
      production = 0,
      rejection = 0,
      dispatch = 0,
      plannedQty = 0,
      remarks = '',
      shortageReason = '',
      isOpeningStockRecord = false,
      enteredBy = 'Supplier'
    } = body;

    if (!supplierId || !partNumber || !date) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check if a record already exists for this supplier, part, date, and enteredBy
    let record = await Production.findOne({ 
      supplierId, 
      partNumber, 
      date, 
      enteredBy,
      ...(shift !== 'N/A' && !isOpeningStockRecord ? { shift } : {}) 
    });

    let finalOpeningStock = openingStock;
    let finalClosingStock = 0;

    if (record) {
      // Merge values to prevent overwriting positive values with default zeros
      const mergedCasting = (body.castingIssued !== undefined && Number(castingIssued) > 0) ? Number(castingIssued) : (record.castingIssued || 0);
      const mergedProduction = (body.production !== undefined && Number(production) > 0) ? Number(production) : (record.production || 0);
      const mergedRejection = (body.rejection !== undefined && Number(rejection) > 0) ? Number(rejection) : (record.rejection || 0);
      const mergedDispatch = (body.dispatch !== undefined && Number(dispatch) > 0) ? Number(dispatch) : (record.dispatch || 0);
      const mergedPlannedQty = (body.plannedQty !== undefined && Number(plannedQty) > 0) ? Number(plannedQty) : (record.plannedQty || 0);
      const mergedOpening = (body.openingStock !== undefined && Number(openingStock) > 0) ? Number(openingStock) : (record.openingStock || 0);
      const mergedRemarks = (remarks && remarks !== record.remarks) ? (record.remarks ? `${record.remarks}, ${remarks}` : remarks) : record.remarks;
      const mergedReason = shortageReason || record.shortageReason;

      if (record.isOpeningStockRecord || isOpeningStockRecord) {
        finalOpeningStock = mergedOpening;
        finalClosingStock = Number(mergedOpening) + Number(mergedCasting);
      } else {
        const prevRecord = await Production.findOne({
          supplierId,
          partNumber,
          enteredBy,
          date: { $lt: date }
        }).sort({ date: -1 });

        finalOpeningStock = prevRecord ? prevRecord.closingStock : 0;
        finalClosingStock = finalOpeningStock + Number(mergedCasting) - Number(mergedDispatch);
      }

      // Update existing record with merged values
      record.productionLine = productionLine || record.productionLine;
      record.shift = shift || record.shift;
      record.openingStock = finalOpeningStock;
      record.castingIssued = mergedCasting;
      record.production = mergedProduction;
      record.rejection = mergedRejection;
      record.dispatch = mergedDispatch;
      record.plannedQty = mergedPlannedQty;
      record.closingStock = finalClosingStock;
      record.remarks = mergedRemarks;
      record.shortageReason = mergedReason;
      record.isOpeningStockRecord = isOpeningStockRecord || record.isOpeningStockRecord;
      record.enteredBy = enteredBy;
      await record.save();
    } else {
      // Create new record
      if (isOpeningStockRecord) {
        finalClosingStock = Number(openingStock) + Number(castingIssued);
      } else {
        const prevRecord = await Production.findOne({
          supplierId,
          partNumber,
          enteredBy,
          date: { $lt: date }
        }).sort({ date: -1 });

        finalOpeningStock = prevRecord ? prevRecord.closingStock : 0;
        finalClosingStock = finalOpeningStock + Number(castingIssued) - Number(dispatch);
      }

      record = await Production.create({
        supplierId,
        partNumber,
        productionLine,
        shift,
        date,
        openingStock: finalOpeningStock,
        castingIssued: Number(castingIssued),
        production: Number(production),
        rejection: Number(rejection),
        dispatch: Number(dispatch),
        plannedQty: Number(plannedQty),
        closingStock: finalClosingStock,
        remarks,
        shortageReason,
        isOpeningStockRecord,
        enteredBy
      });
    }

    // 3. Recalculate all subsequent records for this enteredBy to ensure stock integrity
    const subsequentRecords = await Production.find({
      supplierId,
      partNumber,
      enteredBy,
      date: { $gt: date }
    }).sort({ date: 1 });

    let currentPrevClosing = finalClosingStock;
    for (const subRecord of subsequentRecords) {
      if (!subRecord.isOpeningStockRecord) {
        subRecord.openingStock = currentPrevClosing;
        subRecord.closingStock = currentPrevClosing + (subRecord.castingIssued || 0) - subRecord.dispatch;
        await subRecord.save();
      }
      currentPrevClosing = subRecord.closingStock;
    }

    // 4. Stock alert trigger & Notification dispatch
    const user = await User.findOne({ id: supplierId });
    if (user && !isOpeningStockRecord) {
      const emailList = [user.email, 'sqa-admin@sakthiauto.com', 'purchase@sakthiauto.com', 'management@sakthiauto.com'];
      
      let alertTriggered = false;
      let alertType = '';
      let badge = '';

      if (currentPrevClosing < 100) {
        alertTriggered = true;
        alertType = 'RED ALERT - CRITICAL STOCK SHORTAGE';
        badge = '🔴 RED';
      } else if (currentPrevClosing < 500) {
        alertTriggered = true;
        alertType = 'ORANGE ALERT - LOW STOCK WARNING';
        badge = '🟠 ORANGE';
      }

      if (alertTriggered) {
        const smsMessage = `SAKTHI Alert: ${alertType} for Supplier ${user.id} (${user.name}) on Part ${partNumber}. Current Stock is ${currentPrevClosing} Nos.`;
        const emailSubject = `SAKTHI Partner Hub - ${alertType} [${user.id}]`;
        const emailBody = `Dear Team,\n\nThis is an automated system alert from the SAKTHI Partner Hub.\n\n` +
          `Supplier: ${user.name} (${user.id})\n` +
          `Part Number: ${partNumber}\n` +
          `Production Line: ${productionLine || 'N/A'}\n` +
          `Date of Log: ${date}\n` +
          `Current Stock Level: ${currentPrevClosing} Nos (${badge} Alert)\n\n` +
          `Action Required: SQA and Purchase teams should follow up with the supplier immediately to ensure daily dispatches are met.\n\n` +
          `Best regards,\nSAKTHI Partner Hub System`;

        // Send Emails asynchronously
        for (const recipientEmail of emailList) {
          sendServerEmail(recipientEmail, emailSubject, emailBody).catch(e => 
            console.error(`Failed to send alert email to ${recipientEmail}:`, e)
          );
        }

        // Send SMS to supplier if mobile is available
        if (user.phone) {
          sendServerSMS(user.phone, smsMessage).catch(e => 
            console.error(`Failed to send alert SMS to ${user.phone}:`, e)
          );
        }
      }

      // Check excessive rejection
      const rejectionPercent = production > 0 ? (rejection / production) * 100 : 0;
      if (rejectionPercent > 10) { // Excessive rejection > 10%
        const rejectSubject = `SAKTHI Partner Hub - Quality Alert: Excessive Rejection [${user.id}]`;
        const rejectBody = `Dear Team,\n\nAn excessive rejection rate of ${rejectionPercent.toFixed(1)}% was observed for Supplier ${user.name} (${user.id}) on Part ${partNumber} on ${date}.\n\n` +
          `Production: ${production}\n` +
          `Rejection: ${rejection}\n\n` +
          `Please review the corrective and preventive actions (RC-CA).\n\n` +
          `Best regards,\nSAKTHI Partner Hub System`;

        for (const recipientEmail of emailList) {
          sendServerEmail(recipientEmail, rejectSubject, rejectBody).catch(e => 
            console.error(`Failed to send quality alert email to ${recipientEmail}:`, e)
          );
        }
      }
    }

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Production save error:', error);
    return NextResponse.json({ success: false, message: 'Save failed', error }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      id,
      castingIssued,
      production,
      rejection,
      dispatch,
      plannedQty,
      remarks,
      shortageReason,
      isOpeningStockRecord,
      openingStock
    } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }
    
    let record = await Production.findById(id);
    if (!record) {
      return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }
    
    const { supplierId, partNumber, enteredBy, date } = record;
    
    // Update fields
    if (castingIssued !== undefined) record.castingIssued = Number(castingIssued);
    if (production !== undefined) record.production = Number(production);
    if (rejection !== undefined) record.rejection = Number(rejection);
    if (dispatch !== undefined) record.dispatch = Number(dispatch);
    if (plannedQty !== undefined) record.plannedQty = Number(plannedQty);
    if (remarks !== undefined) record.remarks = remarks;
    if (shortageReason !== undefined) record.shortageReason = shortageReason;
    if (isOpeningStockRecord !== undefined) record.isOpeningStockRecord = isOpeningStockRecord;
    if (openingStock !== undefined) record.openingStock = Number(openingStock);
    
    // Calculate stock
    let finalOpeningStock = record.openingStock;
    let finalClosingStock = 0;
    
    if (record.isOpeningStockRecord) {
      finalClosingStock = Number(record.openingStock) + Number(record.castingIssued || 0);
    } else {
      const prevRecord = await Production.findOne({
        supplierId,
        partNumber,
        enteredBy,
        date: { $lt: date }
      }).sort({ date: -1 });
      
      finalOpeningStock = prevRecord ? prevRecord.closingStock : 0;
      finalClosingStock = finalOpeningStock + Number(record.castingIssued || 0) - Number(record.dispatch);
    }
    
    record.openingStock = finalOpeningStock;
    record.closingStock = finalClosingStock;
    await record.save();
    
    // Recalculate subsequent records
    const subsequentRecords = await Production.find({
      supplierId,
      partNumber,
      enteredBy,
      date: { $gt: date }
    }).sort({ date: 1 });
    
    let currentPrevClosing = finalClosingStock;
    for (const subRecord of subsequentRecords) {
      if (!subRecord.isOpeningStockRecord) {
        subRecord.openingStock = currentPrevClosing;
        subRecord.closingStock = currentPrevClosing + (subRecord.castingIssued || 0) - subRecord.dispatch;
        await subRecord.save();
      }
      currentPrevClosing = subRecord.closingStock;
    }
    
    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("Update log error:", error);
    return NextResponse.json({ success: false, error: error.message || error }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }
    
    const logToDelete = await Production.findById(id);
    if (!logToDelete) {
      return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }
    
    const { supplierId, partNumber, enteredBy, date } = logToDelete;
    
    await Production.findByIdAndDelete(id);
    
    // Recalculate subsequent records
    const prevRecord = await Production.findOne({
      supplierId,
      partNumber,
      enteredBy,
      date: { $lt: date }
    }).sort({ date: -1 });
    
    let currentPrevClosing = prevRecord ? prevRecord.closingStock : 0;
    
    const subsequentRecords = await Production.find({
      supplierId,
      partNumber,
      enteredBy,
      date: { $gt: date }
    }).sort({ date: 1 });
    
    for (const subRecord of subsequentRecords) {
      if (!subRecord.isOpeningStockRecord) {
        subRecord.openingStock = currentPrevClosing;
        subRecord.closingStock = currentPrevClosing + (subRecord.castingIssued || 0) - subRecord.dispatch;
        await subRecord.save();
      }
      currentPrevClosing = subRecord.closingStock;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete log error:", error);
    return NextResponse.json({ success: false, error: error.message || error }, { status: 500 });
  }
}
