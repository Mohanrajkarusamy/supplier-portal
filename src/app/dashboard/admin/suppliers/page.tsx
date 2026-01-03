"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Building2, Phone, Mail, MoreHorizontal, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

import { MOCK_USERS } from "@/lib/auth"
import { useLocalStorage } from "@/hooks/use-local-storage"

export default function SuppliersPage() {
  // Initialize from global mock data or local storage if available
  // We want to persist added suppliers in local storage for the demo session
  const initialSuppliers = Object.values(MOCK_USERS)
      .filter(u => u.role === "SUPPLIER")
      .map(u => ({
          id: u.id,
          name: u.name,
          category: u.companyDetails?.category || "Unknown",
          email: u.email || "",
          phone: u.phone || "",
          status: "Active",
          status: "Active",
          approvedParts: u.companyDetails?.approvedParts || []
      }))

  const [suppliers, setSuppliers] = useLocalStorage<any[]>("demo_suppliers", initialSuppliers) 
  
  const [loading, setLoading] = useState(false)

  // No fetch needed as we rely on useLocalStorage sync
  // const fetchSuppliers = ... 

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Form State
  const [supplierId, setSupplierId] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [operation, setOperation] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  
  // New State for Structured Parts
  const [partsList, setPartsList] = useState<{ name: string; partNumber: string }[]>([])
  const [newPartName, setNewPartName] = useState("")
  const [newPartNumber, setNewPartNumber] = useState("")

  // Delete Flow State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState("")

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [originalSupplierId, setOriginalSupplierId] = useState("")

  const [adminEmail] = useLocalStorage("admin_email", "admin@company.com")

  // Email Feature State
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [selectedSupplierEmail, setSelectedSupplierEmail] = useState("")
  const [selectedSupplierName, setSelectedSupplierName] = useState("")

  const handleOpenEmailDialog = (supplier: any) => {
      setSelectedSupplierEmail(supplier.email)
      setSelectedSupplierName(supplier.name)
      setEmailSubject("Regarding: ")
      setEmailMessage("")
      setEmailDialogOpen(true)
  }

  const handleSendEmail = () => {
      alert(`Simulating Email Sent!\n\nFrom: ${adminEmail}\nTo: ${selectedSupplierName} <${selectedSupplierEmail}>\nSubject: ${emailSubject}\n\nMessage:\n${emailMessage}`)
      setEmailDialogOpen(false)
  }
  
  const handleAddSupplier = () => {
    if (isEditing) {
        handleUpdateSupplier()
        return
    }

    if (suppliers.some(s => s.id === supplierId)) {
        alert("Supplier ID already exists! Please use a unique ID.")
        return
    }

    const newSupplier = {
      id: supplierId,
      name,
      category,
      role: "SUPPLIER",
      email,
      phone,
      status: "Pending Activation",
      role: "SUPPLIER",
      email,
      phone,
      status: "Pending Activation",
      approvedParts: partsList,
      companyDetails: { 
          category,
          approvedParts: partsList
      }
    }

    // Direct state update instead of API call
    setSuppliers([...suppliers, newSupplier])
    
    setOpen(false)
    resetForm()
    alert(`Supplier Created: ${name} (ID: ${supplierId})\n\nSimulating Email from ${adminEmail} to ${email}:\n"Subject: Welcome to Supplier Portal\nPlease register using your User ID: ${supplierId} at the activation page."`)
  }

  const handleUpdateSupplier = () => {
      const updatedList = suppliers.map(s => {
          if (s.id === supplierId) {
             return {
                 ...s,
                 name,
                 category,
                 email,
                 phone,
                 email,
                 phone,
                 approvedParts: partsList,
                 companyDetails: {
                    category,
                    approvedParts: partsList
                 }
             }
          }
          return s
      })

      setSuppliers(updatedList)
      setOpen(false)
      resetForm()
  }

  const handleEditClick = (supplier: any) => {
      setIsEditing(true)
      setOriginalSupplierId(supplier.id) 
      setSupplierId(supplier.id)
      setName(supplier.name)
      setCategory(supplier.category || supplier.companyDetails?.category)
      setEmail(supplier.email)
      setPhone(supplier.phone)
      
      const parts = supplier.approvedParts || supplier.companyDetails?.approvedParts || []
      setPartsList(parts)
       // setApprovedPartsText(parts.join(", ")) - removed
       
      setOperation("") 
      setOpen(true)
  }

  const handleDeleteClick = (id: string) => {
      setSupplierToDelete(id)
      setDeleteReason("")
      setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
      if (!supplierToDelete) return
      
      const updatedList = suppliers.filter(s => s.id !== supplierToDelete)
      setSuppliers(updatedList)
      
      console.log(`Supplier ${supplierToDelete} deleted. Reason: ${deleteReason}`)
      setDeleteDialogOpen(false)
      setSupplierToDelete(null)
  }

  const resetForm = () => {
    setSupplierId("")
    setOriginalSupplierId("")
    setName("")
    setCategory("")
    setOperation("")
    setEmail("")
    setPhone("")
    setEmail("")
    setPhone("")
    // setApprovedPartsText("")
    setPartsList([])
    setNewPartName("")
    setNewPartNumber("")
    setIsEditing(false)
  }

  const handleAddPart = () => {
      if(newPartName && newPartNumber) {
          setPartsList([...partsList, { name: newPartName, partNumber: newPartNumber }])
          setNewPartName("")
          setNewPartNumber("")
      }
  }

  const handleRemovePart = (index: number) => {
      const newList = [...partsList]
      newList.splice(index, 1)
      setPartsList(newList)
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))

  const preMachiningSuppliers = filteredSuppliers.filter(s => s.category === "Pre-Machining")
  const childPartSuppliers = filteredSuppliers.filter(s => s.category === "Child-Part")

  const handleDownloadCSV = () => {
       const headers = ["ID", "Name", "Category", "Approved Components", "Email", "Phone", "Status"]
       const rows = suppliers.map(s => [
           s.id,
           `"${s.name}"`, 
           s.category,
           `"${(s.approvedParts || []).join(", ")}"`, 
           s.email,
           s.phone,
           s.status
       ])
       
       const csvContent = [
           headers.join(","),
           ...rows.map(r => r.join(","))
       ].join("\n")

       const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
       const link = document.createElement("a")
       const url = URL.createObjectURL(blob)
       link.setAttribute("href", url)
       link.setAttribute("download", "approved_suppliers.csv")
       link.style.visibility = "hidden"
       document.body.appendChild(link)
       link.click()
       document.body.removeChild(link)
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Supplier Management</h2>
        <div className="flex items-center space-x-2">
           <Button variant="outline" onClick={handleDownloadCSV}>
               <Download className="mr-2 h-4 w-4" /> Download List
           </Button>
           <Dialog open={open} onOpenChange={(val) => {
               if(!val) resetForm(); // Reset on close
               setOpen(val);
           }}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" /> Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{isEditing ? "Edit Supplier Details" : "Add New Supplier"}</DialogTitle>
                  <DialogDescription>
                    {isEditing ? "Update supplier profile information." : "Create a new supplier profile and generate access credentials."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="id" className="text-right">Supplier ID</Label>
                    <Input 
                        id="id" 
                        value={supplierId} 
                        onChange={(e) => setSupplierId(e.target.value.toUpperCase())} 
                        className="col-span-3" 
                        placeholder="e.g. SUP005" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Company Name" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <Label className="text-right">Category</Label>
                     <div className="col-span-3">
                        <Select value={category} onValueChange={(val) => {
                            setCategory(val);
                            if(val === "Child-Part") setOperation("Full Finishing");
                            else setOperation("") 
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pre-Machining">Pre-Machining</SelectItem>
                                <SelectItem value="Child-Part">Child-Part</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                  </div>
                  
                  {category === "Pre-Machining" && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Operation</Label>
                        <div className="col-span-3">
                           <Select value={operation} onValueChange={setOperation}>
                               <SelectTrigger>
                                   <SelectValue placeholder="Select Operation" />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="Pre Machining">Pre Machining</SelectItem>
                                   <SelectItem value="Semi Finishing">Semi Finishing</SelectItem>
                                   <SelectItem value="Full Finishing">Full Finishing</SelectItem>
                               </SelectContent>
                           </Select>
                        </div>
                     </div>
                  )}

                  {category === "Child-Part" && (
                       <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right">Operation</Label>
                           <div className="col-span-3">
                               <Input value="Full Finishing" disabled className="bg-slate-100" />
                           </div>
                       </div>
                  )}

                   <div className="grid grid-cols-4 items-start gap-4">
                     <Label className="text-right pt-2">Approved Components</Label>
                     <div className="col-span-3 space-y-3">
                        <div className="flex gap-2">
                             <Input 
                                placeholder="Part Name (e.g. Gear)" 
                                value={newPartName}
                                onChange={(e) => setNewPartName(e.target.value)}
                             />
                             <Input 
                                placeholder="Part No (e.g. GS-101)" 
                                value={newPartNumber}
                                onChange={(e) => setNewPartNumber(e.target.value)}
                             />
                             <Button type="button" size="sm" onClick={handleAddPart}>Add</Button>
                        </div>
                        
                        {partsList.length > 0 && (
                            <div className="border rounded-md p-2 bg-slate-50 space-y-1">
                                {partsList.map((part, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-1 border-b last:border-0">
                                        <span><b>{part.name}</b> <span className="text-slate-500">({part.partNumber})</span></span>
                                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleRemovePart(idx)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                   </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" placeholder="contact@company.com" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="+91 ..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddSupplier} disabled={!supplierId || !name || !category || !email}>
                    {isEditing ? "Update Supplier" : "Create Supplier"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      <div className="flex mb-4">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Search suppliers..." 
                  className="pl-8" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
          </div>
      </div>

      <Tabs defaultValue="pre-machining" className="w-full">
         <TabsList className="mb-4">
             <TabsTrigger value="pre-machining">Pre-Machining Suppliers ({preMachiningSuppliers.length})</TabsTrigger>
             <TabsTrigger value="child-part">Child-Part Suppliers ({childPartSuppliers.length})</TabsTrigger>
         </TabsList>
         
         <TabsContent value="pre-machining">
              <Card>
                <CardHeader>
                  <CardTitle>Pre-Machining Suppliers</CardTitle>
                  <CardDescription>Suppliers handling raw casting and pre-machining operations.</CardDescription>
                </CardHeader>
                <CardContent>
                   <SupplierTable data={preMachiningSuppliers} onDeleteClick={handleDeleteClick} onEditClick={handleEditClick} onEmailClick={handleOpenEmailDialog} />
                </CardContent>
              </Card>
         </TabsContent>

         <TabsContent value="child-part">
              <Card>
                <CardHeader>
                  <CardTitle>Child-Part Suppliers</CardTitle>
                  <CardDescription>Suppliers providing finished child parts like gears and shafts.</CardDescription>
                </CardHeader>
                <CardContent>
                   <SupplierTable data={childPartSuppliers} onDeleteClick={handleDeleteClick} onEditClick={handleEditClick} onEmailClick={handleOpenEmailDialog} />
                </CardContent>
              </Card>
         </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle className="text-red-600">Delete Supplier?</DialogTitle>
                  <DialogDescription>
                      This action cannot be undone. This will permanently delete <b>{suppliers.find(s => s.id === supplierToDelete)?.name}</b> from the system.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                       <Label htmlFor="reason">Reason for Deletion</Label>
                       <Textarea 
                          id="reason" 
                          placeholder="Please specify why this supplier is being removed..." 
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                       />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmDelete} disabled={!deleteReason.trim()}>
                      Delete Supplier
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                  <DialogTitle>Send Email to Supplier</DialogTitle>
                  <DialogDescription>
                      Compose a message to <b>{selectedSupplierName}</b>. This will be sent to <i>{selectedSupplierEmail}</i>.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                       <Label htmlFor="subject">Subject</Label>
                       <Input 
                          id="subject" 
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Email Subject"
                       />
                  </div>
                  <div className="grid gap-2">
                       <Label htmlFor="message">Message</Label>
                       <Textarea 
                          id="message" 
                          value={emailMessage}
                          onChange={(e) => setEmailMessage(e.target.value)}
                          placeholder="Type your message here..."
                          rows={5}
                       />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSendEmail} disabled={!emailSubject || !emailMessage}>
                      <Mail className="mr-2 h-4 w-4" /> Send Email
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Component defined outside to prevent re-renders
function SupplierTable({ data, onDeleteClick, onEditClick, onEmailClick }: { data: any[], onDeleteClick: (id: string) => void, onEditClick: (supplier: any) => void, onEmailClick: (supplier: any) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Company Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Approved Components</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
            data.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.id}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                      <Building2 className="mr-2 h-4 w-4 text-slate-500" />
                      <Link href={`/dashboard/admin/suppliers/${supplier.id}`} className="hover:underline hover:text-primary">
                          {supplier.name}
                      </Link>
                  </div>
                </TableCell>
                <TableCell>{supplier.category}</TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {supplier.approvedParts && supplier.approvedParts.length > 0 ? (
                            supplier.approvedParts.map((part: any, idx: number) => (
                                <span key={idx} className="inline-flex items-center rounded-md border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                                    {part.name} ({part.partNumber})
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-muted-foreground italic">None assigned</span>
                        )}
                    </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {supplier.email}</div>
                      <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {supplier.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                   <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                       supplier.status === 'Active' ? 'bg-green-100 text-green-800' : 
                       supplier.status === 'Pending Activation' ? 'bg-blue-100 text-blue-800' :
                       'bg-yellow-100 text-yellow-800'
                   }`}>
                      {supplier.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEmailClick(supplier)}>
                              <Mail className="mr-2 h-4 w-4" /> Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditClick(supplier)}>
                              Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={() => onDeleteClick(supplier.id)}
                          >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Supplier
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
        ) : (
            <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                    No suppliers found in this category.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
