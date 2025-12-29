
export interface Issue {
    id: string
    supplier: string
    defect: string
    partName: string
    partNumber: string
    quantity: number
    raisedDate: string
    closedDate?: string
    status: "Open" | "Closed"
    rootCause?: string
    correctiveAction?: string
    attachments?: string[]
}

export const MOCK_ISSUES: Issue[] = []
