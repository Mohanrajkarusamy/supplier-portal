"use client"

import { useState, useEffect } from "react"
import { Upload, FileUp, CheckCircle, Clock, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useLocalStorage } from "@/hooks/use-local-storage"
import { sendEmail } from "@/lib/email"

export default function SupplierUploadsPage() {
    // In a real app, we would filter by the logged-in supplier ID
    const currentSupplierId = "SUP001" 
    const supplierName = "Alpha Castings" // Mock name

    const [adminEmail] = useLocalStorage("admin_email", "admin@company.com")

    const [uploads, setUploads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUploads = async () => {
        try {
            const res = await fetch(`/api/documents?supplierId=${currentSupplierId}`)
            if (res.ok) {
                const data = await res.json()
                setUploads(data)
            }
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    useEffect(() => {
        fetchUploads()
    }, [])
    
    const [type, setType] = useState<string>("")
    const [partName, setPartName] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const handleUpload = async () => {
        if (!type || !selectedFile) {
            alert("Please select a valid type and file.")
            return
        }

        const formData = new FormData()
        formData.append("type", type)
        formData.append("supplierId", currentSupplierId)
        formData.append("supplierName", supplierName)
        formData.append("partName", partName || "General")
        formData.append("date", new Date().toISOString().split('T')[0])
        formData.append("file", selectedFile)

        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                // Update Store
                fetchUploads()
                
                // Notify Admin via Email
                console.log("Notifying Admin:", adminEmail)
                const subject = `New Document Uploaded: ${type}`
                const message = `Supplier: ${supplierName} (${currentSupplierId})\nDocument Type: ${type}\nPart Reference: ${partName || "General"}\nDate: ${new Date().toISOString().split('T')[0]}\n\nPlease review this submission in the Admin Dashboard.`
                
                // We don't await this to keep UI responsive, or we can toast success
                sendEmail("Admin", adminEmail, message, subject, { from_name: `Supplier: ${supplierName}` }).then(emailRes => {
                    if(!emailRes.success) console.warn("Admin Notification Failed:", emailRes.error)
                })

                // Reset Form
                setType("")
                setPartName("")
                setSelectedFile(null)
                
                alert("Document Uploaded Successfully! Admin has been notified.")
            } else {
                alert("Upload failed")
            }
        } catch (e) {
            alert("Network error")
        }
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
                            <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
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
                                        <TableCell colSpan={4} className="text-center h-24">
                                            {loading ? "Loading..." : "No documents uploaded."}
                                        </TableCell>
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
