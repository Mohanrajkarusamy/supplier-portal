  id: string
  title: string
  type: string
  date: string
  size: string
  status: "Published" | "Draft"
  supplierId?: string // Added for filtering
}

export const MOCK_REPORTS: Report[] = [
  { id: "R001", title: "Daily Quality Report - Batch A", type: "Daily Quality", date: "2025-10-23", size: "1.2 MB", status: "Published" },
  { id: "R002", title: "Monthly Delivery Performance", type: "Monthly Delivery", date: "2025-09-30", size: "2.5 MB", status: "Published" },
  { id: "R003", title: "PPM Analysis Q3", type: "Monthly PPM", date: "2025-09-30", size: "0.8 MB", status: "Published" },
]

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
