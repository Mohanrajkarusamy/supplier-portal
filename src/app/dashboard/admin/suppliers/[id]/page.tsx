"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Mail, Phone, MapPin, FileText, AlertTriangle, BarChart3, Clock, CheckCircle, XCircle } from "lucide-react"
// import { Issue } from "@/lib/issues" - Removed as module deleted
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// We need Document type but it might not be exported from lib/documents directly or valid
// Let's assume ANY for now or define a simple interface if typescript complains, 
// strictly speaking we should just import the type if available. 
// However, the file doesn't import Document type currently.
// Checking previous file content... it imports MOCK_DOCUMENTS from @/lib/documents.
// I'll add useLocalStorage and casting.

export default function SupplierProfilePage() {
    const params = useParams()
    const id = params?.id as string
    
    const [user, setUser] = useState<any>(null)
    const [documents, setDocuments] = useState<any[]>([])
    const [issues, setIssues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return

        async function fetchProfile() {
            try {
                const [userRes, docsRes, issuesRes] = await Promise.all([
                    fetch(`/api/suppliers?id=${id}`),
                    fetch(`/api/documents?supplierId=${id}`),
                    fetch(`/api/issues?supplierId=${id}`)
                ])

                if (userRes.ok) {
                    const userData = await userRes.json()
                    setUser(userData)
                }
                
                if (docsRes.ok) {
                    setDocuments(await docsRes.json())
                }

                if (issuesRes.ok) {
                    setIssues(await issuesRes.json())
                }

            } catch (e) { console.error(e) }
            setLoading(false)
        }

        fetchProfile()
    }, [id])

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Profile...</div>
    
    if (!user) {
        return <div className="p-8 text-center text-muted-foreground">Supplier not found.</div>
    }

    return (
        <div className="flex-1 space-y-6">
            {/* Header / Overview */}
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                   <h2 className="text-3xl font-bold tracking-tight">{user.name}</h2>
                   <div className="flex items-center gap-2 text-muted-foreground mt-1">
                       <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm text-slate-700">{user.id}</span>
                       <span>•</span>
                       <span>{user.companyDetails?.category || user.category || "N/A"}</span>
                   </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Edit Profile</Button>
                    <Button variant="secondary">Contact Supplier</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400"/> {user.email}</div>
                        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400"/> {user.phone}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400"/> {user.companyDetails?.address || user.address || "No address"}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Approved Components</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex flex-wrap gap-1">
                            {user.companyDetails?.approvedParts?.map((part: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                                    {part.name} <span className="opacity-70">({part.partNumber})</span>
                                </span>
                            ))}
                            {(!user.companyDetails?.approvedParts || user.companyDetails.approvedParts.length === 0) && (
                                <span className="text-sm text-muted-foreground">No approved parts listed.</span>
                            )}
                         </div>
                            {(!user.companyDetails?.approvedParts || user.companyDetails.approvedParts.length === 0) && <span className="text-muted-foreground text-sm">None assigned</span>}
                         </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Performance Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold">98%</div>
                         <p className="text-xs text-muted-foreground">Average Delivery & Quality</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="documents">
                <TabsList>
                    <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
                    <TabsTrigger value="issues">Quality Issues ({issues.length})</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="documents" className="space-y-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Uploaded Documents</CardTitle>
                            <CardDescription>PPAP, 8D Reports, and other compliance docs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Part</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.length > 0 ? documents.map(doc => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">{doc.type}</TableCell>
                                            <TableCell>{doc.date}</TableCell>
                                            <TableCell>{doc.partName || "-"}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    doc.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                                                    doc.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {doc.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No documents found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                     </Card>
                </TabsContent>

                <TabsContent value="issues" className="space-y-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Open Quality Issues</CardTitle>
                            <CardDescription>Non-Conformance Reports (NCR) and Complaints.</CardDescription>
                        </CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Issue ID</TableHead>
                                        <TableHead>Defect</TableHead>
                                        <TableHead>Part</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issues.length > 0 ? issues.map(issue => (
                                        <TableRow key={issue.id}>
                                            <TableCell className="font-medium">{issue.id}</TableCell>
                                            <TableCell>{issue.description || issue.defect}</TableCell>
                                            <TableCell>{issue.partName}</TableCell>
                                             <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    issue.status === 'Closed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {issue.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No quality issues recorded.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                         </CardContent>
                     </Card>
                </TabsContent>

                <TabsContent value="performance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Trends</CardTitle>
                            <CardDescription>Visual analysis of OTIF and PPM over time.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                            Chart visualization placeholder. <br/> (Reuse EnhancedCharts component here in future)
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
