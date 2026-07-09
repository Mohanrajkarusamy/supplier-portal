"use client"

import { useState, useEffect } from "react"
import { Upload, FileUp, CheckCircle, Clock, Send, FileText, AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function SupplierUploadsPage() {
    const [supplierId, setSupplierId] = useState("")
    const [uploads, setUploads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const id = localStorage.getItem("currentUserId") || "SUP001"
        setSupplierId(id)
        fetchUploads(id)
    }, [])

    const fetchUploads = async (id: string) => {
        try {
            const res = await fetch(`/api/documents?supplierId=${id}`)
            if (res.ok) {
                const data = await res.json()
                setUploads(data)
            }
        } catch (e) { console.error(e) }
        setLoading(false)
    }
    
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
        formData.append("supplierId", supplierId)
        formData.append("partName", partName || "General")
        formData.append("date", new Date().toISOString().split('T')[0])
        formData.append("file", selectedFile)

        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                fetchUploads(supplierId)
                setType("")
                setPartName("")
                setSelectedFile(null)
                alert("Document Uploaded successfully! Admin notified.")
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Upload failed: ${errData.message || errData.error || 'Server error'}`)
            }
        } catch (e) {
            alert("Network error")
        }
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Document Management</h2>
                    <p className="text-slate-500">Submit quality assurance and compliance documents for approval.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-5 lg:grid-cols-7">
                <Card className="md:col-span-2 lg:col-span-3 border-t-4 border-t-primary shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileUp className="mr-2 h-5 w-5 text-primary" /> Submit New Document
                        </CardTitle>
                        <CardDescription>Select the document category and upload the document (any format).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Document Category</Label>
                             <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="border-slate-300">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="APQP">APQP (Advanced Product Quality Planning)</SelectItem>
                                    <SelectItem value="PPAP">PPAP (Production Part Approval Process)</SelectItem>
                                    <SelectItem value="PSW">PSW (Part Submission Warrant)</SelectItem>
                                    <SelectItem value="4M Change Request">4M Change Request (Man, Machine, Material, Method)</SelectItem>
                                    <SelectItem value="Action Plan">Action Plan (Corrective Action)</SelectItem>
                                    <SelectItem value="Setting Part Approval">Setting Part Approval</SelectItem>
                                    <SelectItem value="8D Report">8D Problem Solving Report</SelectItem>
                                    <SelectItem value="CMS/NCR">CMS raise/NCR Document</SelectItem>
                                </SelectContent>
                              </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>Part Number / Reference</Label>
                             <Input 
                                value={partName} 
                                onChange={(e) => setPartName(e.target.value)} 
                                placeholder="e.g. S-101-H / Concern #456" 
                                className="border-slate-300"
                             />
                        </div>
                        <div className="space-y-2">
                            <Label>File Attachment (Any Format)</Label>
                            <Input type="file" className="cursor-pointer border-slate-300" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                        </div>
                        <Button className="w-full bg-primary text-white hover:bg-orange-600 h-10" onClick={handleUpload} disabled={!type}>
                            <Upload className="mr-2 h-4 w-4" /> Upload & Submit
                        </Button>
                        <div className="p-3 bg-slate-50 border rounded-md flex items-start gap-3">
                            <AlertCircle className="h-4 w-4 text-slate-400 mt-0.5" />
                            <p className="text-[10px] text-slate-500 leading-normal">
                                Submitting a document will automatically alert the SQA Admin. You can track the status in the history table.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 lg:col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Clock className="mr-2 h-5 w-5 text-slate-400" /> Submission History
                        </CardTitle>
                        <CardDescription>Track the approval status of your recent submissions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                          <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead>Type</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Remarks</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uploads.length > 0 ? (
                                    uploads.map((u) => (
                                        <TableRow key={u.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium py-3">{u.type}</TableCell>
                                            <TableCell className="text-slate-600">{u.partName}</TableCell>
                                            <TableCell className="text-slate-500 text-xs">{u.date}</TableCell>
                                            <TableCell className="text-slate-500 text-xs max-w-[150px] truncate" title={u.details}>{u.details || "-"}</TableCell>
                                            <TableCell>
                                                {u.status === "Approved" ? (
                                                    <Badge variant="default" className="bg-green-600">Approved</Badge>
                                                ) : u.status === "Rejected" ? (
                                                     <Badge variant="destructive">Rejected</Badge>
                                                ) : (
                                                     <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pending</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => window.open(u.fileUrl, '_blank')}
                                                    className="h-8"
                                                >
                                                    <Download className="mr-1 h-3.5 w-3.5" /> Download
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-48 text-slate-400 italic">
                                            {loading ? "Loading submissions..." : "No documents submitted yet."}
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
