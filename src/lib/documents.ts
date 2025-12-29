
export interface Document {
    id: string
    type: "PPAP" | "4M Change Management" | "Action Plan" | "Setting Part Approval" | "8D Report" | "CMS Document" | "Other"
    supplierId: string
    supplierName: string
    partName?: string
    date: string
    status: "Pending" | "Approved" | "Rejected"
    fileUrl: string
    remarks?: string
}

export const MOCK_DOCUMENTS: Document[] = []
