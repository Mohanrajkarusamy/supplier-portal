export interface Report {
  id: string
  title: string
  type: string
  date: string
  size: string
  status: "Published" | "Draft"
  supplierId?: string // Added for filtering
}

export const MOCK_REPORTS: Report[] = []

export const REPORT_TYPES = [
  "Daily Quality Report",
  "Monthly Quality Report",
  "Daily Delivery Report",
  "Monthly Delivery Report",
  "Monthly PPM Report",
  "Monthly Debit Report",
  "Drawing",
  "PSW Signed",
  "Audit Report",
  "Customer Complaint IR Report",
  "CMS Approval",
]
