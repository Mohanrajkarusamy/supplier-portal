"use client"

import { useState } from "react"
import { Upload, FileUp, CheckCircle, Clock, Send } from "lucide-react"
import { MOCK_DOCUMENTS, Document } from "@/lib/documents"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SupplierUploadsPage() {
    // In a real app, we would filter by the logged-in supplier ID
    const currentSupplierId = "SUP001" 
    const supplierName = "Alpha Castings" // Mock name

    const [uploads, setUploads] = useState(MOCK_DOCUMENTS.filter(d => d.supplierId === currentSupplierId))
    const [type, setType] = useState<string>("")
    const [partName, setPartName] = useState("")

    const handleUpload = () => {
        if (!type) return

        const newDoc: Document = {
            id: `D${Date.now()}`,
            type: type as any,
            supplierId: currentSupplierId,
            supplierName: supplierName,
            partName: partName || "General",
            date: new Date().toISOString().split('T')[0],
            status: "Pending",
            fileUrl: `doc_${Date.now()}.pdf` // Simulated file
        }

        // Update Global Store
        MOCK_DOCUMENTS.unshift(newDoc)
        
        // Update Local State
        setUploads([newDoc, ...uploads])
        
        // Reset Form
        setType("")
        setPartName("")
        // Reset Form
        setType("")
        setPartName("")
        alert("Document Uploaded Successfully!")
    }

    const handleSendEmail = () => {
        if (!type) {
            alert("Please select a Document Type first.")
            return
        }
        alert(`Simulating Email Notification...\nTo: Admin (admin@company.com)\nSubject: New Document Notification from ${supplierName} (${currentSupplierId})\n\nBody: Please note that a new ${type} document is available for review regarding part: ${partName || "General"}.`)
    }

    return (
        <div className="flex-1 space-y-4">
             <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Document Uploads</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Submit Document</CardTitle>
                        <CardDescription>Upload quality and compliance documents.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Document Type</Label>
                             <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PPAP">PPAP</SelectItem>
                                    <SelectItem value="AM Change Mangement">AM Change Mangement</SelectItem>
                                    <SelectItem value="Action Plan">Action Plan</SelectItem>
                                    <SelectItem value="Setting Part Approval">Setting Part Approval</SelectItem>
                                    <SelectItem value="8D Report">8D Report</SelectItem>
                                    <SelectItem value="CMS raise/document">CMS raise/document</SelectItem>
                                </SelectContent>
                              </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>Part Name / Reference</Label>
                             <Input 
                                value={partName} 
                                onChange={(e) => setPartName(e.target.value)} 
                                placeholder="e.g. Cylinder Head / NCR #123" 
                             />
                        </div>
                        <div className="space-y-2">
                            <Label>File Attachment</Label>
                            <Input type="file" />
                        </div>
                        <div className="flex space-x-2">
                             <Button className="flex-1" onClick={handleUpload} disabled={!type}>
                                <Upload className="mr-2 h-4 w-4" /> Upload Document
                            </Button>
                            <Button className="flex-1" variant="secondary" onClick={handleSendEmail} disabled={!type}>
                                <Send className="mr-2 h-4 w-4" /> Send Email
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Submission History</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Part/Ref</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uploads.length > 0 ? (
                                    uploads.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">{u.type}</TableCell>
                                            <TableCell>{u.partName}</TableCell>
                                            <TableCell>{u.date}</TableCell>
                                            <TableCell className="text-right">
                                                {u.status === "Approved" ? (
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                        <CheckCircle className="mr-1 h-3 w-3" /> Approved
                                                    </span>
                                                ) : u.status === "Rejected" ? (
                                                     <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                        <Clock className="mr-1 h-3 w-3" /> Rejected
                                                    </span>
                                                ) : (
                                                     <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                                        <Clock className="mr-1 h-3 w-3" /> Pending
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">No documents uploaded.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
