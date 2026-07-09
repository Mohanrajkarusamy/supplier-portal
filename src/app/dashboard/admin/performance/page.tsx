"use client"

import { useState, useEffect } from "react"
import { Save, Plus, Trash2, ShieldCheck, Mail, AlertTriangle, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function AdminPerformancePage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  
  // Entry Type
  const [entryType, setEntryType] = useState<"Performance" | "Inventory">("Performance")

  // Performance Form Fields
  const [partName, setPartName] = useState("") 
  const [partNumber, setPartNumber] = useState("")
  const [productionLine, setProductionLine] = useState("")
  const [shiftTargetsText, setShiftTargetsText] = useState("")
  
  const [plannedQty, setPlannedQty] = useState("")
  const [loadReceived, setLoadReceived] = useState("")
  const [castingIssued, setCastingIssued] = useState("")
  
  // Inventory Specific
  const [isInitialStock, setIsInitialStock] = useState(false)
  const [initialStockQty, setInitialStockQty] = useState("")

  // Rejections State
  const [rejectionList, setRejectionList] = useState<{ reason: string, qty: string }[]>([{ reason: "", qty: "" }])
  
  // Complaints State
  const [complaints, setComplaints] = useState("")
  const [complaintDetails, setComplaintDetails] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await fetch('/api/suppliers')
        if (res.ok) {
          const data = await res.json()
          setSuppliers(data.filter((u: any) => u.role === "SUPPLIER_USER"))
        }
      } catch (e) {
        console.error("Failed to fetch suppliers", e)
      }
    }
    fetchSuppliers()
  }, [])

  const selectedSupplier = suppliers.find((s: any) => s.id === selectedSupplierId)
  
  // Convert approvedParts structure
  const approvedParts = selectedSupplier?.companyDetails?.approvedParts?.map((p: any) => {
      if (typeof p === 'string') return { name: p, partNumber: 'N/A' }
      return p 
  }) || []

  const handlePartSelect = (pName: string) => {
      setPartName(pName)
      const part = approvedParts.find((p: any) => p.name === pName)
      if (part) {
          setPartNumber(part.partNumber)
          setProductionLine(part.productionLine || "Line-1")
          const targets = part.shiftTargets;
          if (targets) {
              let text = `Shift A: ${targets.shiftA || 0}, Shift B: ${targets.shiftB || 0}`;
              let dailyPlan = Number(targets.shiftA || 0) + Number(targets.shiftB || 0);
              if (part.shiftScheme !== "2-shifts" && targets.shiftC) {
                  text += `, Shift C: ${targets.shiftC}`;
                  dailyPlan += Number(targets.shiftC || 0);
              }
              setShiftTargetsText(text);
              setPlannedQty(String(dailyPlan));
          } else {
              setShiftTargetsText("Not configured");
              setPlannedQty("0");
          }
      } else {
          setPartNumber("")
          setProductionLine("")
          setShiftTargetsText("")
          setPlannedQty("")
      }
  }

  const handleAddRejectionRow = () => {
    setRejectionList([...rejectionList, { reason: "", qty: "" }])
  }

  const handleRemoveRejectionRow = (index: number) => {
    const newList = [...rejectionList]
    newList.splice(index, 1)
    setRejectionList(newList)
  }

  const handleRejectionChange = (index: number, field: "reason" | "qty", value: string) => {
    const newList = [...rejectionList]
    newList[index][field] = value
    setRejectionList(newList)
  }

  const calculateTotalRejected = () => {
    return rejectionList.reduce((acc, item) => acc + (Number(item.qty) || 0), 0)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId) {
        alert("Please select a supplier")
        return
    }
    if (!partName) {
        alert("Please select a part")
        return
    }

    setSubmitting(true)
    const totalRejected = calculateTotalRejected()
    const rejectionSummary = rejectionList.map(r => r.reason).filter(Boolean).join(", ")

    try {
        const payload: any = {
            supplierId: selectedSupplierId,
            partNumber,
            productionLine: productionLine || "Line-1",
            shift: "N/A",
            date: entryDate,
            remarks: rejectionSummary || (entryType === "Inventory" ? "Inventory adjustment" : "Daily performance log"),
            enteredBy: "Admin",
            entryType
        }

        if (entryType === "Inventory") {
            payload.castingIssued = Number(castingIssued) || 0
            payload.isOpeningStockRecord = isInitialStock
            payload.openingStock = isInitialStock ? Number(initialStockQty) || 0 : 0
            payload.production = 0
            payload.rejection = 0
            payload.dispatch = 0
            payload.plannedQty = 0
        } else {
            payload.castingIssued = 0
            payload.isOpeningStockRecord = false
            payload.openingStock = 0
            payload.production = 0
            payload.rejection = totalRejected
            payload.dispatch = Number(loadReceived) || 0
            payload.plannedQty = Number(plannedQty) || 0
        }

        // 1. POST to /api/production
        const res = await fetch('/api/production', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const result = await res.json()
        if (!result.success) {
            alert(`Failed: ${result.message}`)
            setSubmitting(false)
            return
        }

        // 2. Trigger auto complaint/NCR if complaints exist
        let ncrMsg = ""
        if (entryType === "Performance" && (Number(complaints) > 0 || complaintDetails)) {
            const complainRes = await fetch('/api/issues/complain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: selectedSupplierId,
                    partNumber,
                    partName,
                    complaintsCount: Number(complaints) || 1,
                    complaintDetails: complaintDetails || "Customer complaint registered",
                    message: emailMessage || `A customer complaint count of ${complaints} was registered for part ${partName}.`,
                    raisedDate: entryDate
                })
            })
            const complainResult = await complainRes.json()
            if (complainResult.success) {
                ncrMsg = "\n\nNCR Quality Issue created & email notification triggered!"
            } else {
                ncrMsg = `\n\n⚠️ Failed to trigger NCR: ${complainResult.message}`
            }
        }

        alert(`Log saved successfully!${ncrMsg}`)
        
        // Reset states
        setLoadReceived("")
        setCastingIssued("")
        setInitialStockQty("")
        setIsInitialStock(false)
        setRejectionList([{ reason: "", qty: "" }])
        setComplaints("")
        setComplaintDetails("")
        setEmailMessage("")
        setPartName("")
        setPartNumber("")
        setProductionLine("")
        setShiftTargetsText("")
        setPlannedQty("")
    } catch (e) {
        console.error(e)
        alert("An error occurred during save.")
    }
    setSubmitting(false)
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Daily Performance Entry</h2>
        <Button asChild className="bg-primary hover:bg-orange-600 text-white shadow-sm">
            <a href="/dashboard/admin/performance-logs">View Performance Logs</a>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 shadow-md">
              <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-lg flex items-center">
                      <FileSpreadsheet className="mr-2 h-5 w-5 text-slate-400" /> SQA Daily Ledger Logger
                  </CardTitle>
                  <CardDescription>Enter daily plan targets, receipts, scrap rejections, and castings issued.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                  <form onSubmit={handleSave} className="space-y-4">
                      {/* Entry Type Toggle */}
                      <div className="flex bg-slate-100 p-1 rounded-md border w-fit">
                          <button
                            type="button"
                            onClick={() => setEntryType("Performance")}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${entryType === "Performance" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                          >
                              Daily Performance Log
                          </button>
                          <button
                            type="button"
                            onClick={() => setEntryType("Inventory")}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${entryType === "Inventory" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                          >
                              Casting Issue & Initial Stock
                          </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label>Date</Label>
                              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                              <Label>Select Supplier</Label>
                              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} required>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select Supplier" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {suppliers.map((s) => (
                                          <SelectItem key={s.id} value={s.id}>
                                              {s.name} ({s.id})
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label>Part Name</Label>
                              <Select value={partName} onValueChange={handlePartSelect} disabled={!selectedSupplierId}>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select Approved Part" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {approvedParts.map((p: any, idx: number) => (
                                          <SelectItem key={idx} value={p.name}>
                                              {p.name}
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label>Part Number</Label>
                              <Input value={partNumber} placeholder="Auto-filled" disabled className="bg-slate-100 text-slate-500" />
                          </div>
                      </div>

                      {entryType === "Inventory" ? (
                          <div className="space-y-4 pt-2 border-t mt-4">
                              <div className="flex items-center space-x-2 py-2">
                                  <input 
                                      id="isInitialStock" 
                                      type="checkbox" 
                                      checked={isInitialStock} 
                                      onChange={(e) => setIsInitialStock(e.target.checked)}
                                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                  />
                                  <Label htmlFor="isInitialStock" className="text-sm font-bold text-slate-700 cursor-pointer">
                                      Set Initial Opening Stock? (At start of production)
                                  </Label>
                              </div>

                              {isInitialStock && (
                                  <div className="space-y-2">
                                      <Label>Opening Stock Quantity</Label>
                                      <Input 
                                          value={initialStockQty} 
                                          onChange={(e) => setInitialStockQty(e.target.value)} 
                                          type="number" 
                                          placeholder="Initial opening stock count"
                                      />
                                  </div>
                              )}

                              <div className="space-y-2">
                                  <Label>Casting Quantity Issued</Label>
                                  <Input 
                                      value={castingIssued} 
                                      onChange={(e) => setCastingIssued(e.target.value)} 
                                      type="number" 
                                      placeholder="Casting qty sent to supplier"
                                  />
                              </div>
                          </div>
                      ) : (
                          <>
                              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                  <div className="space-y-2">
                                      <Label>Line</Label>
                                      <Input value={productionLine} disabled className="bg-slate-100 text-slate-500 font-mono" />
                                  </div>
                                  <div className="space-y-2">
                                      <Label>Shift-wise Target Schemes</Label>
                                      <Input value={shiftTargetsText} disabled className="bg-slate-100 text-slate-500 font-mono" />
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <Label className="font-bold text-blue-700">Daily Planned Target (Qty)</Label>
                                      <Input value={plannedQty} onChange={(e) => setPlannedQty(e.target.value)} type="number" placeholder="Override Daily Target Plan" />
                                  </div>
                                  <div className="space-y-2">
                                      <Label className="font-bold text-green-700">Load Received (Actual Delivered Qty)</Label>
                                      <Input value={loadReceived} onChange={(e) => setLoadReceived(e.target.value)} type="number" placeholder="Actual Qty Received" />
                                  </div>
                              </div>
                              
                              {/* Rejections */}
                              <div className="space-y-2 border-t pt-4">
                                  <div className="flex items-center justify-between">
                                      <Label>Quality Rejections (Total: {calculateTotalRejected()})</Label>
                                      <Button variant="outline" size="sm" onClick={handleAddRejectionRow} type="button">
                                          <Plus className="h-4 w-4 mr-1" /> Add Reason Row
                                      </Button>
                                  </div>
                                  {rejectionList.map((item, index) => (
                                      <div key={index} className="flex gap-2 items-center">
                                          <Input 
                                              value={item.reason} 
                                              onChange={(e) => handleRejectionChange(index, "reason", e.target.value)}
                                              placeholder="Defect Reason / Code"
                                              className="flex-1"
                                          />
                                          <Input 
                                              value={item.qty} 
                                              onChange={(e) => handleRejectionChange(index, "qty", e.target.value)}
                                              placeholder="Qty"
                                              type="number"
                                              className="w-24"
                                          />
                                          {rejectionList.length > 1 && (
                                              <Button variant="ghost" size="icon" onClick={() => handleRemoveRejectionRow(index)} className="text-red-500">
                                                  <Trash2 className="h-4 w-4" />
                                              </Button>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </>
                      )}

                      <div className="pt-4 border-t flex justify-end">
                          <Button type="submit" disabled={submitting} className="bg-primary hover:bg-orange-600 text-white font-medium">
                              <Save className="h-4 w-4 mr-2" /> {submitting ? "Saving..." : "Save Daily Log"}
                          </Button>
                      </div>
                  </form>
              </CardContent>
          </Card>

          <div className="space-y-6">
              {entryType === "Performance" && (
                  <Card className="shadow-md border-l-4 border-l-red-500">
                      <CardHeader>
                          <CardTitle className="text-red-800 text-md flex items-center">
                              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" /> Customer Complaint & NCR
                          </CardTitle>
                          <CardDescription>Optionally log a customer complaint to auto-generate a supplier NCR issue.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                              <Label>Complaint Count</Label>
                              <Input 
                                  value={complaints} 
                                  onChange={(e) => setComplaints(e.target.value)} 
                                  type="number" 
                                  placeholder="e.g. 1" 
                              />
                          </div>
                          <div className="space-y-2">
                              <Label>Defect details</Label>
                              <Textarea 
                                  value={complaintDetails} 
                                  onChange={(e) => setComplaintDetails(e.target.value)} 
                                  placeholder="Describe the complaint in detail..." 
                                  rows={3}
                              />
                          </div>
                          <div className="space-y-2">
                              <Label>Email message to supplier</Label>
                              <Textarea 
                                  value={emailMessage} 
                                  onChange={(e) => setEmailMessage(e.target.value)} 
                                  placeholder="Notification content to supplier..." 
                                  rows={4}
                              />
                          </div>
                      </CardContent>
                  </Card>
              )}
          </div>
      </div>
    </div>
  )
}
