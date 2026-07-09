"use client"

import { useState } from "react"
import { Upload, FileText, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DataUploadPage() {
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)

    const handleFileUpload = async (type: 'production' | 'quality' | 'delivery', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setStatus(null)

        const reader = new FileReader()
        reader.onload = async (event) => {
            const csv = event.target?.result as string
            const lines = csv.split('\n').filter(l => l.trim() !== '')
            const headers = lines[0].split(',')

            // Basic CSV to JSON conversion
            const data = lines.slice(1).map(line => {
                const values = line.split(',')
                const obj: any = {}
                headers.forEach((header, index) => {
                    const h = header.trim()
                    const v = values[index]?.trim()
                    // Convert numbers where possible
                    obj[h] = isNaN(Number(v)) ? v : Number(v)
                })
                return obj
            })

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, data })
                })
                const result = await res.json()
                if (result.success) {
                    setStatus({ type: 'success', msg: `Successfully uploaded ${data.length} records.` })
                } else {
                    setStatus({ type: 'error', msg: result.message || 'Upload failed' })
                }
            } catch (error) {
                setStatus({ type: 'error', msg: 'Network error or invalid data' })
            } finally {
                setUploading(false)
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Bulk Data Upload</h2>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle>Instructions</AlertTitle>
                <AlertDescription>
                    Upload CSV files to update system data in bulk. Ensure headers match the expected format exactly.
                    All data is permanently stored and will immediately update supplier dashboards and KPIs.
                </AlertDescription>
            </Alert>

            {status && (
                <Alert className={status.type === 'success' ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    {status.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                    <AlertTitle>{status.type === 'success' ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{status.msg}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="production" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="production">Production</TabsTrigger>
                    <TabsTrigger value="quality">Quality</TabsTrigger>
                    <TabsTrigger value="delivery">Delivery</TabsTrigger>
                </TabsList>

                <TabsContent value="production">
                    <UploadCard 
                        title="Production Data" 
                        description="Upload Daily Load Receipt and Casting Issue data."
                        headers="supplierId, partNumber, date, quantityReceived, quantityIssued"
                        onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload('production', e)}
                        uploading={uploading}
                    />
                </TabsContent>

                <TabsContent value="quality">
                    <UploadCard 
                        title="Quality Performance" 
                        description="Upload In-House and Supplier End Rejections."
                        headers="supplierId, concernNumber, type, partNumber, quantity, defectReason, severity, raisedDate"
                        onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload('quality', e)}
                        uploading={uploading}
                    />
                </TabsContent>

                <TabsContent value="delivery">
                    <UploadCard 
                        title="Delivery & OTD" 
                        description="Update Planned vs Delivered quantities and OTD scores."
                        headers="supplierId, month, plannedQuantity, deliveredQuantity, otdPercentage, premiumFreight, lineStoppage"
                        onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload('delivery', e)}
                        uploading={uploading}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function UploadCard({ title, description, headers, onUpload, uploading }: any) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 border-2 border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center space-y-3 py-10 text-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">CSV or XLSX (CSV recommended)</p>
                    </div>
                    <label className="cursor-pointer">
                        <input type="file" className="hidden" accept=".csv" onChange={onUpload} disabled={uploading} />
                        <Button variant="outline" size="sm" asChild disabled={uploading}>
                            <span>Select File</span>
                        </Button>
                    </label>
                </div>

                <div className="bg-slate-900 rounded-md p-3">
                    <h4 className="text-white text-xs font-mono mb-2 flex items-center">
                        <FileText className="h-3 w-3 mr-2" /> Required CSV Headers:
                    </h4>
                    <code className="text-primary text-[10px] break-all">{headers}</code>
                </div>
            </CardContent>
        </Card>
    )
}
