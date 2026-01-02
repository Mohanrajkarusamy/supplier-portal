import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, userId, password, email, ...data } = body;

    // LOGIN
    if (action === 'LOGIN') {
      const user = await User.findOne({ id: userId });
      if (!user) return NextResponse.json({ success: false, message: 'User not found' });
      
      // Password check with bcrypt
      const isMatch = await bcrypt.compare(password, user.password || "");
      if (!isMatch) {
         return NextResponse.json({ success: false, message: 'Invalid password' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name }, 
        JWT_SECRET, 
        { expiresIn: '1d' }
      );

      return NextResponse.json({ success: true, user, token });
    }

    // ACTIVATE
    if (action === 'ACTIVATE') {
      const user = await User.findOne({ id: userId });
      if (!user) return NextResponse.json({ success: false, message: 'User not found' });
      if (user.email !== email) return NextResponse.json({ success: false, message: 'Email mismatch' });

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.status = "Active";
      await user.save();

      const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name }, 
        JWT_SECRET, 
        { expiresIn: '1d' }
      );

      return NextResponse.json({ success: true, message: 'Account activated', token, user });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error', error });
  }
}
