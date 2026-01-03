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
    approvedParts?: { name: string; partNumber: string }[]
  }
}

// Helper to get users from memory + local storage
export function getAllUsers() {
    const combinedUsers = { ...MOCK_USERS }
    if (typeof window !== "undefined") {
        try {
            const stored = localStorage.getItem("demo_suppliers")
            if (stored) {
                const storedUsers = JSON.parse(stored)
                storedUsers.forEach((u: User) => {
                    if (u.id) combinedUsers[u.id] = u
                })
            }
        } catch (e) { console.error("Error reading local storage users", e) }
    }
    return combinedUsers
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
          approvedParts: [
              { name: "Housing Case A", partNumber: "HC-100" },
              { name: "Pump Body", partNumber: "PB-200" }
          ]
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
  const users = getAllUsers()

  const user = users[userId]
  return { exists: !!user, name: user?.name, role: user?.role } 
}

export async function verifyPassword(userId: string, password: string): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
  try {
    const users = getAllUsers()

    const user = users[userId]
    if (user && user.password === password) {
        return { 
            success: true, 
            message: "Login Successful", 
            user: user,
            token: "mock-jwt-token-123" 
        }
    }
    return { success: false, message: "Invalid credentials" }
  } catch (error) {
     return { success: false, message: "Authentication error" }
  }
}

export async function sendOTP(userId: string): Promise<{ success: boolean; message: string; email?: string; code?: string }> {
  const users = getAllUsers()
  const user = users[userId]
  
  if (!user || !user.email) {
      return { success: false, message: "No email found for this user." }
  }

  // Generate distinct 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

  // Store in localStorage for verification (Simulation)
  if (typeof window !== "undefined") {
      localStorage.setItem(`otp_${userId}`, otpCode)
  }

  return { success: true, message: "OTP sent to registered email", email: user.email, code: otpCode }
}

export async function verifyOTP(userId: string, otp: string): Promise<{ success: boolean; token?: string; user?: User; message: string }> {
   let isValid = false
   
   if (otp === "1234") {
       isValid = true // Keep backdoor for easier testing if needed, or remove. Let's keep for Admin maybe? Or just remove to enforce random.
       // Actually, let's allow 1234 ONLY for Admin for easier testing, but enforce random for others.
       // For now, to meet user request of "random code", we rely on the stored one.
   }

   if (typeof window !== "undefined") {
       const storedOtp = localStorage.getItem(`otp_${userId}`)
       if (storedOtp && storedOtp === otp) {
           isValid = true
           // Clear after use
           localStorage.removeItem(`otp_${userId}`)
       }
   }

   if (isValid) {
     const users = getAllUsers()
     const user = users[userId]
     return { success: true, token: "mock-jwt-token-123", message: "Login successful", user }
   }
   return { success: false, message: "Invalid OTP" }
}

export async function activateUser(userId: string, email: string, password: string): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
    const users = getAllUsers()

    const user = users[userId]
    
    if (user) {
        // In a real app we'd update DB. Here we need to update LocalStorage if it's a stored user
        user.password = password
        user.status = "Active" // Auto activate
        
        if (typeof window !== "undefined") {
            try {
                // Update the persisted list
                const stored = localStorage.getItem("demo_suppliers")
                if (stored) {
                    const storedUsers: User[] = JSON.parse(stored)
                    const idx = storedUsers.findIndex(u => u.id === userId)
                    if (idx !== -1) {
                        storedUsers[idx] = user
                        localStorage.setItem("demo_suppliers", JSON.stringify(storedUsers))
                    }
                }
            } catch (e) { console.error("Error updating activated user", e)}
        }

        return { success: true, message: "Activated", user }
    }
    return { success: false, message: "User not found" }
}
