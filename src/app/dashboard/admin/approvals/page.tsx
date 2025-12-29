"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, Eye, FileText } from "lucide-react"
import { MOCK_DOCUMENTS, Document } from "@/lib/documents"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function AdminApprovalsPage() {
    // Filter to show only Pending documents initially, or allow filtering
    // For "Approvals" page, showing Pending is the primary use case.
    const [docs, setDocs] = useState(MOCK_DOCUMENTS.filter(d => d.status === "Pending"))
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
    const [remarks, setRemarks] = useState("")

    const refreshDocs = () => {
        setDocs(MOCK_DOCUMENTS.filter(d => d.status === "Pending"))
    }

    const handleAction = (status: "Approved" | "Rejected") => {
        if (!selectedDoc) return

        // Update in Shared Store
        const docIndex = MOCK_DOCUMENTS.findIndex(d => d.id === selectedDoc.id)
        if (docIndex >= 0) {
            MOCK_DOCUMENTS[docIndex].status = status
            MOCK_DOCUMENTS[docIndex].remarks = remarks
        }

        alert(`Document ${status} Successfully!`)
        
        // Refresh List
        refreshDocs()
        setSelectedDoc(null)
        setRemarks("")
    }

    const handleDownload = () => {
        // Simulation of download
        alert(`Downloading file: ${selectedDoc?.fileUrl}`)
    }

    return (
        <div className="flex-1 space-y-4">
             <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Approvals</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Documents</CardTitle>
                    <CardDescription>Review and approve supplier submissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Document Type</TableHead>
                                <TableHead>Part Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {docs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No pending approvals.</TableCell>
                                </TableRow>
                            ) : (
                                docs.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium">{doc.supplierName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                                {doc.type}
                                            </div>
                                        </TableCell>
                                        <TableCell>{doc.partName}</TableCell>
                                        <TableCell>{doc.date}</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedDoc(doc)}>
                                                        <Eye className="mr-2 h-4 w-4" /> Review
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Review {doc.type}</DialogTitle>
                                                        <DialogDescription>
                                                            Submitted by {doc.supplierName} on {doc.date}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label className="text-right">File</Label>
                                                            <div className="col-span-3 flex items-center space-x-2">
                                                                <span className="text-sm text-gray-500">{doc.fileUrl}</span>
                                                                <Button size="sm" variant="outline" onClick={handleDownload}>Download</Button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label htmlFor="remarks" className="text-right">Remarks</Label>
                                                            <Input 
                                                                id="remarks" 
                                                                className="col-span-3" 
                                                                placeholder="Reason for rejection or approval note..." 
                                                                value={remarks}
                                                                onChange={(e) => setRemarks(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="destructive" onClick={() => handleAction("Rejected")}>
                                                            <XCircle className="mr-2 h-4 w-4" /> Reject
                                                        </Button>
                                                        <Button onClick={() => handleAction("Approved")}>
                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
