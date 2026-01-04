"use client"

import { useState } from "react"
import { Save, Search, Trash2, Plus, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllUsers } from "@/lib/auth"
import { MOCK_DAILY_LOGS, DailyLog } from "@/lib/performance"
// Define interface locally to match usage
interface Issue {
  id: string;
  supplier: string;
  defect: string;
  partName: string;
  partNumber: string;
  quantity: number;
  raisedDate: string;
  status: string;
  attachments: string[];
}

const MOCK_ISSUES: Issue[] = [];
import { Textarea } from "@/components/ui/textarea"

export default function AdminPerformancePage() {
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  
  // Data Form
  const [partName, setPartName] = useState("") 
  const [partNumber, setPartNumber] = useState("")
  const [loadReceived, setLoadReceived] = useState("")
  const [castingIssued, setCastingIssued] = useState("") // Target
  
  // Rejection State
  const [rejectionList, setRejectionList] = useState<{ reason: string, qty: string }[]>([{ reason: "", qty: "" }])
  
  const [complaints, setComplaints] = useState("")
  const [complaintDetails, setComplaintDetails] = useState("")
  const [complaintFiles, setComplaintFiles] = useState<File[]>([])
  const [emailMessage, setEmailMessage] = useState("")
  
  const allUsers = getAllUsers()
  const suppliers = Object.values(allUsers).filter(u => u.role === "SUPPLIER")

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId)
  
  // Convert approvedParts to new structure if needed (handle legacy or new)
  const approvedParts = selectedSupplier?.companyDetails?.approvedParts?.map(p => {
      if (typeof p === 'string') return { name: p, partNumber: 'N/A' }
      return p 
  }) || []

  const handlePartSelect = (pName: string) => {
      setPartName(pName)
      const part = approvedParts.find(p => p.name === pName)
      if (part) {
          setPartNumber(part.partNumber)
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

  const handleSave = () => {
    if (!selectedSupplierId) return;
    if (!partName) {
        alert("Please enter a Part Name")
        return
    }

    const totalRejected = calculateTotalRejected()
    const rejectionSummary = rejectionList.map(r => r.reason).filter(Boolean).join(", ")
    const processedBreakdown = rejectionList.filter(r => r.reason && r.qty).map(r => ({ reason: r.reason, qty: Number(r.qty) }))

    const newLog: DailyLog = {
        id: `LOG-${Date.now()}`,
        date: entryDate,
        partName: partName, 
        loadReceived: Number(loadReceived) || 0,
        castingIssued: Number(castingIssued) || 0,
        rejectedQty: totalRejected,
        rejectionDescription: rejectionSummary, // Summary string
        rejectionBreakdown: processedBreakdown,
        complaints: Number(complaints) || 0,
        complaintDetails: complaintDetails,
        deliveryStatus: "On-Time" 
    }

    // Initialize array if not exists
    if (!MOCK_DAILY_LOGS[selectedSupplierId]) {
        MOCK_DAILY_LOGS[selectedSupplierId] = []
    }

    // Remove existing entry for same date AND same part if any (overwrite logic)
    const existingIndex = MOCK_DAILY_LOGS[selectedSupplierId].findIndex(l => l.date === entryDate && l.partName === partName)
    if (existingIndex >= 0) {
        MOCK_DAILY_LOGS[selectedSupplierId][existingIndex] = newLog
    } else {
        MOCK_DAILY_LOGS[selectedSupplierId].push(newLog)
    }

    // AUTO-CREATE NCR IF COMPLAINTS EXIST
    if ((Number(complaints) || 0) > 0) {
        const supplierObj = suppliers.find(s => s.id === selectedSupplierId)
        const supplierName = supplierObj?.name || "Unknown Supplier"
        const supplierEmail = supplierObj?.email || "unknown@supplier.com"

        // Mock "Upload"
        const attachmentUrls = complaintFiles.map(f => URL.createObjectURL(f))

        const newIssue: Issue = {
            id: `NCR-AUTO-${Date.now()}`,
            supplier: supplierName,
            defect: complaintDetails || "Customer Complaint Logged via Performance",
            partName: partName,
            partNumber: partNumber || "N/A",
            quantity: Number(complaints) || 1,
            raisedDate: entryDate,
            status: "Open",
            attachments: attachmentUrls
        }
        MOCK_ISSUES.unshift(newIssue)
        console.log("Auto-created NCR:", newIssue)

        // Simulate Email Notification
        alert(`LOG SAVED.\n\nSimulating Email to: ${supplierEmail}\nSubject: New Customer Complaint Registered\n\nmessage: "${emailMessage}"\n\nAttachments: ${complaintFiles.length} photos attached.\n(NCR ${newIssue.id} created)`)
    } else {
        alert(`Daily Log Saved for ${selectedSupplierId} (${partName})\nTotal Rejected: ${totalRejected}`)
    }
    
    // Reset form mostly, keep date
    setLoadReceived("")
    setCastingIssued("")
    setRejectionList([{ reason: "", qty: "" }])
    setComplaints("")
    setComplaintDetails("")
    setComplaintFiles([]) // Reset files
    setEmailMessage("")
    setPartName("") 
    setPartNumber("")
  }

  return (
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Daily Performance Entry</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Select Supplier & Date</CardTitle>
                <CardDescription>Choose the supplier to update daily logs for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Supplier" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name} ({s.companyDetails?.category || "Unknown"})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Enter Daily Data</CardTitle>
                <CardDescription>Update production and quality metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <Label>Part Name</Label>
                         <Select value={partName} onValueChange={handlePartSelect} disabled={!selectedSupplierId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Approved Part" />
                            </SelectTrigger>
                            <SelectContent>
                                {approvedParts.length > 0 ? (
                                    approvedParts.map((p, idx) => (
                                        <SelectItem key={idx} value={p.name}>
                                            {p.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>No parts assigned</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                         <Label>Part Number</Label>
                         <Input 
                            value={partNumber} 
                            placeholder="Auto-filled" 
                            disabled 
                            className="bg-slate-100 text-slate-500"
                        />
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Load Received</Label>
                        <Input value={loadReceived} onChange={(e) => setLoadReceived(e.target.value)} type="number" placeholder="Qty Received"/>
                    </div>
                    <div className="space-y-2">
                        <Label>Casting Issued (Target)</Label>
                        <Input value={castingIssued} onChange={(e) => setCastingIssued(e.target.value)} type="number" placeholder="Target Qty"/>
                    </div>
                 </div>
                 
                 {/* Dynamic Rejection Section */}
                 <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <Label>Rejection Details (Total: {calculateTotalRejected()})</Label>
                        <Button variant="outline" size="sm" onClick={handleAddRejectionRow} type="button">
                            <Plus className="h-4 w-4 mr-1" /> Add Reason
                        </Button>
                    </div>
                    
                    {rejectionList.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <div className="w-1/3">
                                <Input 
                                    value={item.qty} 
                                    onChange={(e) => handleRejectionChange(index, "qty", e.target.value)} 
                                    type="number" 
                                    placeholder="Qty"
                                />
                            </div>
                            <div className="flex-1">
                                <Input 
                                    value={item.reason} 
                                    onChange={(e) => handleRejectionChange(index, "reason", e.target.value)} 
                                    placeholder="Reason (e.g. Crack)"
                                />
                            </div>
                            {rejectionList.length > 1 && (
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveRejectionRow(index)} type="button">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            )}
                        </div>
                    ))}
                 </div>

                 {/* Complaint Section */}
                 <div className="space-y-2 border-t pt-4">
                    <Label>Customer Complaints</Label>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <Input 
                                value={complaints} 
                                onChange={(e) => setComplaints(e.target.value)} 
                                type="number" 
                                placeholder="Count"
                            />
                        </div>
                        <div className="col-span-2">
                             <Input 
                                value={complaintDetails} 
                                onChange={(e) => setComplaintDetails(e.target.value)} 
                                placeholder="Details/Description of complaints..."
                            />
                        </div>
                        <div className="col-span-3">
                            <Label>Complaint Photos</Label>
                            <Input 
                                type="file" 
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setComplaintFiles(Array.from(e.target.files))
                                    }
                                }} 
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Attached photos will be automatically emailed to the supplier.
                            </p>
                        </div>
                        
                        <div className="col-span-3 space-y-2 border-t pt-2 mt-2">
                             <Label>Message to Supplier</Label>
                             <div className="flex gap-2 items-start">
                                <Textarea 
                                   value={emailMessage}
                                   onChange={(e) => setEmailMessage(e.target.value)}
                                   placeholder="Enter message for the supplier..."
                                   className="flex-1"
                                />
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-700 h-auto py-3"
                                    onClick={handleSave}
                                    disabled={!complaints && !complaintDetails && complaintFiles.length === 0}
                                    type="button"
                                >
                                    <div className="flex flex-col items-center">
                                       <Send className="h-4 w-4 mb-1" />
                                       <span className="text-xs">Send</span>
                                    </div>
                                </Button>
                             </div>
                        </div>
                    </div>
                 </div>

                 <Button onClick={handleSave} className="w-full mt-4" disabled={!selectedSupplierId}>
                    <Save className="mr-2 h-4 w-4" /> Save Daily Log
                 </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
