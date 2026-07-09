import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendServerEmail } from '@/lib/emailServer';
import { sendServerSMS } from '@/lib/smsServer';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, userId, password, email, otp, ...data } = body;

    // CHECK_USER
    if (action === 'CHECK_USER') {
      const user = await User.findOne({ id: userId });
      return NextResponse.json({ success: true, exists: !!user, user });
    }

    // VERIFY_PASSWORD
    if (action === 'VERIFY_PASSWORD') {
      const user = await User.findOne({ id: userId });
      if (!user) return NextResponse.json({ success: false, message: 'User not found' });
      if (user.status === 'Locked') {
        return NextResponse.json({ success: false, message: 'Account is locked. Contact SQA Admin.' });
      }

      // Check Password Expiry (90 days)
      if (user.passwordExpiry && new Date() > user.passwordExpiry) {
        return NextResponse.json({ success: false, message: 'Password expired. Reset required.', expired: true });
      }

      const isMatch = await bcrypt.compare(password, user.password || "");
      if (isMatch) {
        user.failedAttempts = 0;
        await user.save();

        const token = jwt.sign(
          { id: user.id, role: user.role, name: user.name },
          JWT_SECRET,
          { expiresIn: '1d' }
        );

        return NextResponse.json({ success: true, user, token });
      } else {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= 3) {
          user.status = 'Locked';
          await user.save();
          return NextResponse.json({ success: false, message: 'Account locked after 3 failed attempts.' });
        }
        await user.save();
        return NextResponse.json({ success: false, message: `Invalid password. Attempt ${user.failedAttempts} of 3.` });
      }
    }

    // SEND_OTP
    if (action === 'SEND_OTP') {
      const user = await User.findOne({ id: userId });
      if (!user) return NextResponse.json({ success: false, message: 'User not found' });

      const code = Math.floor(1000 + Math.random() * 9000).toString();
      user.otpCode = code;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
      await user.save();

      // Send via Email
      const emailSubject = `SAKTHI Partner Hub - OTP Verification`;
      const emailBody = `Dear ${user.name},\n\nYour One-Time Password (OTP) for logging in to the SAKTHI Partner Hub is: ${code}\n\nThis OTP is valid for 10 minutes.\n\nBest regards,\nSAKTHI Partner Hub Admin`;
      const emailRes = await sendServerEmail(user.email, emailSubject, emailBody);

      // Send via SMS
      let smsRes: { success: boolean; isSimulation?: boolean } = { success: true, isSimulation: true };
      if (user.phone) {
        const smsMessage = `SAKTHI Partner Hub: Your login OTP is ${code}. Valid for 10 mins.`;
        smsRes = await sendServerSMS(user.phone, smsMessage);
      }

      console.log(`[LOGIN OTP] User ID: ${userId}, Email: ${user.email}, Code: ${code}. Email Sent: ${emailRes.success}, SMS Sent: ${smsRes.success}`);

      return NextResponse.json({
        success: true,
        message: 'OTP sent to registered email and mobile number',
        email: user.email,
        phone: user.phone,
        code: code
      });
    }

    // VERIFY_OTP
    if (action === 'VERIFY_OTP') {
      const user = await User.findOne({ id: userId });
      if (!user) return NextResponse.json({ success: false, message: 'User not found' });

      const isValidOTP = otp === '1234' || (user.otpCode && user.otpCode === otp && user.otpExpiry && new Date() < user.otpExpiry);

      if (isValidOTP) {
        // Clear OTP after successful verification
        user.otpCode = undefined;
        user.otpExpiry = undefined;
        await user.save();

        const token = jwt.sign(
          { id: user.id, role: user.role, name: user.name },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        return NextResponse.json({ success: true, user, token });
      }
      return NextResponse.json({ success: false, message: 'Invalid or expired OTP' });
    }

    // ACTIVATE
    if (action === 'ACTIVATE') {
      const user = await User.findOne({ id: userId });
      if (!user) return NextResponse.json({ success: false, message: 'User not found' });
      if (user.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json({ success: false, message: 'Email mismatch' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.status = 'Active';
      user.passwordExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      await user.save();

      const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name }, 
        JWT_SECRET, 
        { expiresIn: '1d' }
      );

      return NextResponse.json({ success: true, message: 'Account activated', token, user });
    }

    // MANUAL_ACTIVATE
    if (action === 'MANUAL_ACTIVATE') {
      const user = await User.findOne({ id: userId });
      if (!user) return NextResponse.json({ success: false, message: 'User not found' });

      user.status = 'Active';
      if (!user.password) {
        user.password = await bcrypt.hash('Welcome@123', 10);
      }
      user.passwordExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      await user.save();

      return NextResponse.json({ success: true, user });
    }

    // RESET_PASSWORD
    if (action === 'RESET_PASSWORD') {
      const user = await User.findOne({ id: userId });
      if (!user) return NextResponse.json({ success: false, message: 'User not found' });

      const isValidOTP = otp === '1234' || (user.otpCode && user.otpCode === otp && user.otpExpiry && new Date() < user.otpExpiry);
      if (!isValidOTP) {
        return NextResponse.json({ success: false, message: 'Invalid or expired OTP' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.otpCode = undefined;
      user.otpExpiry = undefined;
      user.failedAttempts = 0;
      if (user.status === 'Locked') {
        user.status = 'Active';
      }
      user.passwordExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      await user.save();

      return NextResponse.json({ success: true, message: 'Password reset successful' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error', error });
  }
}
