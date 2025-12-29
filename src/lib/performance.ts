import { MOCK_USERS } from "./auth"

export interface MonthlyPerformance {
  month: string
  qualityScore: number // 0-100
  deliveryScore: number // 0-100
  complaints: number
  repeatedProblems: number
}

// Mock Database: SupplierID -> Array of Monthly Data
export const MOCK_PERFORMANCE: Record<string, MonthlyPerformance[]> = {}

export interface ProblemCategory {
    name: string
    value: number
}

export const REPEATED_PROBLEMS_DATA: Record<string, ProblemCategory[]> = {}

export interface DailyLog {
    id: string
    date: string
    partName: string // Could serve as Supplier Type indicator if needed, but we rely on Auth profile
    loadReceived: number
    castingIssued: number // This acts as the Target
    rejectedQty: number
    rejectionDescription: string // Main or Summary reason
    rejectionBreakdown?: { reason: string, qty: number }[] // Detailed breakdown
    complaints: number // Count of complaints
    complaintDetails?: string // Detailed description of complaints
    deliveryStatus?: "On-Time" | "Delayed" // Optional status
    remarks?: string
}

export const MOCK_DAILY_LOGS: Record<string, DailyLog[]> = {}

// Helper to get ranking
export function getSupplierRankings(category: string) {
    const validSuppliers = Object.values(MOCK_USERS).filter(u => u.role === "SUPPLIER" && u.companyDetails?.category === category)
    
    // Calculate average score for last 3 months
    const ranked = validSuppliers.map(supplier => {
        const perf = MOCK_PERFORMANCE[supplier.id] || []
        const last3 = perf.slice(-3)
        const avgScore = last3.length > 0 
            ? last3.reduce((acc, curr) => acc + (curr.qualityScore + curr.deliveryScore)/2, 0) / last3.length
            : 0
        
        return {
            ...supplier,
            averageScore: avgScore
        }
    }).sort((a, b) => b.averageScore - a.averageScore)

    return ranked
}
