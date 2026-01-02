export type UserRole = "ADMIN" | "SUPPLIER"

export interface User {
  id: string
  name: string
  role: UserRole
  email?: string
  phone?: string
  password?: string
  status?: "Active" | "Pending Activation" | "Inactive"
  companyDetails?: {
    address: string
    category?: "Pre-Machining" | "Child-Part"
    operationType?: "Pre Machining" | "Semi Finishing" | "Full Finishing"
    approvedParts?: string[]
  }
}

// Mock Database of users - Kept for reference or seed if needed, but app uses API
export let MOCK_USERS: Record<string, User> = {
  "ADMIN01": { 
      id: "ADMIN01", 
      name: "System Admin", 
      role: "ADMIN", 
      email: "admin@company.com",
      password: "1234"
  },
  "SUP001": {
      id: "SUP001",
      name: "Andavar Casting",
      role: "SUPPLIER",
      email: "supp1@company.com", 
      phone: "9876543210",
      password: "1234",
      status: "Active",
      companyDetails: {
          address: "123 Industrial Estate",
          category: "Pre-Machining",
          operationType: "Pre Machining",
          approvedParts: ["Housing Case A", "Pump Body"]
      }
  }
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export async function registerUser(userData: Partial<User>): Promise<{ success: boolean; message: string; userId?: string }> {
    // Registration logic is skipped for now as we use Admin panel to add suppliers
    return { success: true, message: "Use Admin Panel to add suppliers", userId: "N/A" }
}

export async function checkUser(userId: string): Promise<{ exists: boolean; name?: string; role?: "ADMIN" | "SUPPLIER" }> {
  // Simplified check, in real app this would hit an API endpoint
  return { exists: true } 
}

export async function verifyPassword(userId: string, password: string): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
  try {
    const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGIN', userId, password })
    })
    const data = await res.json()
    return data
  } catch (error) {
     return { success: false, message: "Network error" }
  }
}

export async function sendOTP(userId: string): Promise<{ success: boolean; message: string }> {
  // Mock OTP for now, no API needed unless we want to log it
  return { success: true, message: "OTP sent to registered email/phone" }
}

export async function verifyOTP(userId: string, otp: string): Promise<{ success: boolean; token?: string; user?: User; message: string }> {
   if (otp === "1234") {
      // In a real app we would exchange OTP for token here or validate session.
      // For now, return success.
     return { success: true, token: "mock-jwt-token-123", message: "Login successful" }
   }
   return { success: false, message: "Invalid OTP" }
}

export async function activateUser(userId: string, email: string, password: string): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ACTIVATE', userId, email, password })
        })
        const data = await res.json()
        return data  
    } catch(error) {
        return { success: false, message: "Network error" }
    }
}
