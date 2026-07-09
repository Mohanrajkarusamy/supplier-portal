import { MOCK_USERS } from "./auth"

export interface MonthlyPerformance {
    month: string;
    qualityScore: number;
    deliveryScore: number;
    complaints: number;
}

export interface DailyLog {
    id: string;
    date: string;
    partName: string;
    loadReceived: number;
    castingIssued: number;
    rejectedQty: number;
    rejectionDescription: string;
    rejectionBreakdown?: { reason: string, qty: number }[];
    complaints?: number;
    complaintDetails?: string;
    deliveryStatus: "On-Time" | "Delayed";
}

export const MOCK_DAILY_LOGS: Record<string, DailyLog[]> = {
    "SUP001": [
        {
            id: "LOG001",
            date: "2026-06-20",
            partName: "Engine Block A",
            loadReceived: 500,
            castingIssued: 480,
            rejectedQty: 5,
            rejectionDescription: "Casting cracks",
            deliveryStatus: "On-Time"
        }
    ]
};

export function calculateTotalScore(data: {
    qualityPerformance: number; 
    deliveryPerformance: number; 
    responsiveness: number; 
    audit5S: number; 
}) {
    let score = data.qualityPerformance + data.deliveryPerformance + data.responsiveness + data.audit5S;
    return Math.round(score);
}

export function getGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
}

export function checkRedStatus(data: {
    customerComplaint: boolean;
    lineStoppage: boolean;
    unauthorized4M: boolean;
    repeatMajorIssue: boolean;
}) {
    return data.customerComplaint || data.lineStoppage || data.unauthorized4M || data.repeatMajorIssue;
}

export function getSupplierRankings(category: string) {
    const suppliers = Object.values(MOCK_USERS)
        .filter(u => u.role === "SUPPLIER_USER" && (u.category === category || u.companyDetails?.category === category))
        .map(u => ({
            id: u.id,
            name: u.name,
            averageScore: 92.5, // default mock score
            status: u.status
        }));
    return suppliers;
}
