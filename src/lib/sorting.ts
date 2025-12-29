export type SortingStatus = "Pending" | "Validated" | "Rejected"

export interface SortingLog {
  id: string
  supplierId: string
  supplierName: string
  date: string
  partName: string
  totalQty: number
  defectsFound: number
  reworkedQty: number
  okQty: number 
  status: SortingStatus
}

export const MOCK_SORTING_LOGS: SortingLog[] = [
  {
    id: "SR001",
    supplierId: "SUP001",
    supplierName: "Andavar Casting",
    date: "2025-05-10",
    partName: "Housing Case A",
    totalQty: 500,
    defectsFound: 15,
    reworkedQty: 10,
    okQty: 495,
    status: "Validated"
  },
  {
    id: "SR002",
    supplierId: "SUP002",
    supplierName: "Star Components",
    date: "2025-05-11",
    partName: "Gear Shaft",
    totalQty: 1000,
    defectsFound: 50,
    reworkedQty: 45,
    okQty: 995,
    status: "Pending"
  }
]
