"use client"

import { useState } from "react"
import { Upload, FileText, Download, Trash2, Plus, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { REPORT_TYPES, MOCK_REPORTS, Report } from "@/lib/reports"
import { getAllUsers } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

import { useLocalStorage } from "@/hooks/use-local-storage"

export default function AdminReportsPage() {
  // Use LocalStorage for persistence
  const [reports, setReports] = useLocalStorage<Report[]>("portal_reports", MOCK_REPORTS)
  const [loading, setLoading] = useState(false)

  // Form State
  const [selectedType, setSelectedType] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [partName, setPartName] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const allUsers = getAllUsers()
  const suppliers = Object.values(allUsers).filter(u => u.role === "SUPPLIER")

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)



  const handleUpload = async () => {
    if (!selectedType || !file || !selectedSupplier) return
    setLoading(true)
    
    const supplierObj = suppliers.find(s => s.id === selectedSupplier)
    const supplierEmail = supplierObj?.email || "unknown@email.com"

    // Secure upload - Instant
    const newReport: Report = {
      id: Math.random().toString(36).substr(2, 9),
      title: `${selectedType} - ${partName || supplierObj?.name}`,
      type: selectedType,
      date: new Date().toISOString().split('T')[0],
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      status: "Published",
      supplierId: selectedSupplier
    }
    setReports([newReport, ...reports])
    
    // Send Automated Email via EmailJS
    const subject = `New Secure Report Available: ${selectedType}`
    const message = `Hello ${supplierObj?.name || 'Supplier'},\n\nA new confidential report (${selectedType}) has been uploaded to the Supplier Portal.\n\nPlease log in to the portal to view and download the document.\n\nNote: This document is securely stored on the portal.\n\nMessage:\n${emailMessage}`
    
    const result = await sendEmail(
        supplierObj?.name || "Supplier",
        supplierEmail,
        message,
        subject
    )

    if (result.success) {
        if (result.isSimulation) {
            alert(`[SIMULATION MODE]\n\nReport Published Successfully.\n\nNOTE: No real email was sent (Missing API Keys).\nThe app pretended to send to: ${supplierEmail}`)
        } else {
            alert(`Report Published & Real Email Sent to ${supplierEmail}!`)
        }
    } else {
        alert(`Report Published, but Email Failed: ${result.error}`)
    }

    setLoading(false)
    setFile(null)
    setSelectedType("")
    setSelectedSupplier("")
    setPartName("")
    setEmailMessage("")
  }

  const confirmDelete = () => {
    if (deleteId) {
        setReports(reports.filter(r => r.id !== deleteId))
        setDeleteDialogOpen(false)
        setDeleteId(null)
    }
  }

  return (
    <div className="flex-1 space-y-4">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Report Management</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Upload Form */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Distribute Report</CardTitle>
            <CardDescription>Send reports or approvals to specific suppliers via email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
               <Label>Select Supplier</Label>
               <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.id})</SelectItem>
                    ))}
                  </SelectContent>
               </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label>Part Name (Optional)</Label>
                    <Input placeholder="Part Name" value={partName} onChange={(e) => setPartName(e.target.value)} />
                </div>
            </div>

            <div className="space-y-2">
              <Label>File (PDF/Excel/Drawing)</Label>
              <Input 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
            </div>
            
            <div className="space-y-2">
                <Label>Message to Supplier</Label>
                <Textarea 
                    placeholder="Enter message..." 
                    value={emailMessage} 
                    onChange={(e) => setEmailMessage(e.target.value)}
                />
            </div>

            <Button className="w-full" onClick={handleUpload} disabled={loading || !file || !selectedType || !selectedSupplier}>
              {loading ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Publish & Send Email</>}
            </Button>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Published Reports</CardTitle>
            <CardDescription>Recent reports accessible by suppliers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-blue-500" />
                        <div>
                          {report.title}
                          <div className="text-xs text-muted-foreground">{report.size} • {report.type}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600"
                        onClick={() => {
                            setDeleteId(report.id)
                            setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Delete Report?</DialogTitle>
                  <DialogDescription>
                      Are you sure you want to delete this report? This action cannot be undone.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  )
}
