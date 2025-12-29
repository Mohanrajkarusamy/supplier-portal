export type UserRole = "ADMIN" | "SUPPLIER"

export interface User {
  id: string
  name: string
  role: UserRole
  email?: string
  phone?: string
  password?: string // In a real app, this would be hashed
  companyDetails?: {
    address: string
    category?: "Pre-Machining" | "Child-Part"
    operationType?: "Pre Machining" | "Semi Finishing" | "Full Finishing"
    approvedParts?: string[]
  }
}

// Mock Database of users
// We'll export this as a let so we can modify it at runtime (mock registration)
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
      companyDetails: {
          address: "123 Industrial Estate",
          category: "Pre-Machining",
          operationType: "Pre Machining",
          approvedParts: ["Housing Case A", "Pump Body"]
      }
  },
  "SUP002": {
      id: "SUP002", 
      name: "Star Components", 
      role: "SUPPLIER", 
      email: "supp2@company.com",
      phone: "9988776655",
      password: "1234",
      companyDetails: {
          address: "456 Tech Park",
          category: "Child-Part",
          operationType: "Full Finishing",
          approvedParts: ["Gear Shaft", "Pinion"]
      }
  }
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

// Simulation functions
export async function registerUser(userData: Partial<User>): Promise<{ success: boolean; message: string; userId?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // Generate simple ID
    const newId = `SUP${Object.keys(MOCK_USERS).length + 1}`.padEnd(6, '0') // e.g., SUP004... but logic mock
    // Better ID generation for mock
    const count = Object.keys(MOCK_USERS).length
    const id = `SUP00${count}` // Simple collision avoidance for prototype

    MOCK_USERS[id.toUpperCase()] = {
        id: id,
        name: userData.name || "Unknown",
        role: "SUPPLIER",
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        companyDetails: {
            address: userData.companyDetails?.address || "",
            category: "Pre-Machining" // Default pending admin review
        }
    }

    return { success: true, message: "Registration Successful", userId: id }
}

export async function checkUser(userId: string): Promise<{ success: boolean; exists: boolean }> {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true, exists: !!MOCK_USERS[userId.toUpperCase()] }
}

export async function verifyPassword(userId: string, password: string): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800))
    const user = MOCK_USERS[userId.toUpperCase()]
    
    if (!user) return { success: false, message: "User not found" }
    if (user.password === password) return { success: true, message: "Password Verified" }
    
    return { success: false, message: "Invalid Password" }
}

export async function sendOTP(userId: string): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  const user = MOCK_USERS[userId.toUpperCase()]
  if (!user) {
    return { success: false, message: "User ID not found" }
  }
  // Simulate sending to Email/Phone
  return { success: true, message: `OTP sent to ${user.email} and ${user.phone}` }
}

export async function verifyOTP(userId: string, otp: string): Promise<{ success: boolean; token?: string; user?: User; message: string }> {
   await new Promise((resolve) => setTimeout(resolve, 1000))

   const user = MOCK_USERS[userId.toUpperCase()]
   
   if (otp === "1234") {
     return { success: true, user, token: "mock-jwt-token-123", message: "Login successful" }
   }
   
   return { success: false, message: "Invalid OTP" }
}
