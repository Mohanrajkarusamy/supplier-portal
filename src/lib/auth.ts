import { Users, BarChart3, Upload, FileText, IndianRupee, GitPullRequest, Settings } from "lucide-react"

export type UserRole = 'SUPER_ADMIN' | 'SQA_ADMIN' | 'SUPPLIER_USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  status: 'Active' | 'Pending Activation' | 'Inactive' | 'Locked';
  category?: 'Pre-Machining' | 'Child-Part';
  passwordExpiry?: Date;
  failedAttempts?: number;
  phone?: string;
  companyDetails?: {
    category?: string;
    approvedParts?: { name: string; partNumber: string }[];
  }
}

export const MOCK_USERS: Record<string, User> = {
  "ADMIN01": {
    id: "ADMIN01",
    name: "Sakthi Admin",
    email: "admin@sakthiauto.com",
    role: "SUPER_ADMIN",
    password: "Password@123",
    status: "Active",
    passwordExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  },
  "SUP001": {
    id: "SUP001",
    name: "Mohanraj Karusamy",
    email: "supplier@example.com",
    role: "SUPPLIER_USER",
    password: "Password@123",
    status: "Active",
    category: "Pre-Machining",
    failedAttempts: 0,
    passwordExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    companyDetails: {
        category: "Pre-Machining",
        approvedParts: [
            { name: "Engine Block A", partNumber: "EB-101" },
            { name: "Cylinder Head B", partNumber: "CH-202" }
        ]
    }
  }
};

export function validatePasswordStrength(password: string): { valid: boolean; message: string } {
    if (password.length < 8) return { valid: false, message: "Minimum 8 characters required" };
    if (!/[A-Z]/.test(password)) return { valid: false, message: "Must include an uppercase letter" };
    if (!/[0-9]/.test(password)) return { valid: false, message: "Must include a number" };
    if (!/[!@#$%^&*]/.test(password)) return { valid: false, message: "Must include a special character" };
    return { valid: true, message: "Strong password" };
}

export async function checkUser(id: string): Promise<{ exists: boolean; user?: User; error?: any; message?: string }> {
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CHECK_USER', userId: id })
        });
        return await res.json();
    } catch (e) {
        return { exists: false, error: e, message: "Connection error" };
    }
}

export async function verifyPassword(userId: string, password: string): Promise<{ success: boolean; message?: string; expired?: boolean; user?: User; token?: string }> {
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'VERIFY_PASSWORD', userId, password })
        });
        return await res.json();
    } catch (e) {
        return { success: false, message: "Connection error" };
    }
}

export async function sendOTP(userId: string): Promise<{ success: boolean; message: string; email?: string; code?: string }> {
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SEND_OTP', userId })
        });
        return await res.json();
    } catch (e) {
        return { success: false, message: "Connection error" };
    }
}

export async function verifyOTP(userId: string, otp: string): Promise<{ success: boolean; message?: string; user?: User; token?: string }> {
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'VERIFY_OTP', userId, otp })
        });
        return await res.json();
    } catch (e) {
        return { success: false, message: "Connection error" };
    }
}

export async function activateUser(userId: string, email: string, password: string): Promise<{ success: boolean; message?: string; token?: string; user?: User }> {
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ACTIVATE', userId, email, password })
        });
        return await res.json();
    } catch (e) {
        return { success: false, message: "Connection error" };
    }
}

export async function manualActivateUser(userId: string): Promise<{ success: boolean; message?: string; user?: User }> {
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'MANUAL_ACTIVATE', userId })
        });
        return await res.json();
    } catch (e) {
        return { success: false, message: "Connection error" };
    }
}

export async function resetPassword(userId: string, otp: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'RESET_PASSWORD', userId, otp, password })
        });
        return await res.json();
    } catch (e) {
        return { success: false, message: "Connection error" };
    }
}

export function getAllUsers() {
    return MOCK_USERS;
}
