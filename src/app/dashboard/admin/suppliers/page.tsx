"use client"

import { useState } from "react"
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


import { MOCK_USERS, User } from "@/lib/auth"

export default function SuppliersPage() {
  // Initialize from global mock data
  const [suppliers, setSuppliers] = useState(
    Object.values(MOCK_USERS)
      .filter(u => u.role === "SUPPLIER")
      .map(u => ({
          id: u.id,
          name: u.name,
          category: u.companyDetails?.category || "Unknown",
          email: u.email || "",
          phone: u.phone || "",
          status: "Active",
          approvedParts: u.companyDetails?.approvedParts || []
      }))
  )
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Form State
  const [supplierId, setSupplierId] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [operation, setOperation] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [approvedPartsText, setApprovedPartsText] = useState("")

  // Delete Flow State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState("")

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [originalSupplierId, setOriginalSupplierId] = useState("")

  const handleAddSupplier = () => {
    if (isEditing) {
        handleUpdateSupplier()
        return
    }

    if (MOCK_USERS[supplierId]) {
        alert("Supplier ID already exists! Please use a unique ID.")
        return
    }

    // 1. Create Local Display Object
    const newSupplierDisplay = {
      id: supplierId,
      name,
      category,
      email,
      phone,
      status: "Active",
      approvedParts: approvedPartsText.split(",").map(p => p.trim()).filter(Boolean)
    }

    // 2. Update Global MOCK_USERS (So other pages see it)
    MOCK_USERS[newSupplierDisplay.id] = {
        id: newSupplierDisplay.id,
        name: name,
        role: "SUPPLIER",
        email: email,
        phone: phone,
        password: "1234", // Default temp password
        companyDetails: {
            address: "New Added Address", 
            category: category as "Pre-Machining" | "Child-Part",
            operationType: operation as any,
            approvedParts: approvedPartsText.split(",").map(p => p.trim()).filter(Boolean)
        }
    }

    // 3. Update Local State for Table
    setSuppliers([...suppliers, newSupplierDisplay])
    setOpen(false)
    resetForm()
  }

  const handleUpdateSupplier = () => {
      // Check for ID conflict if ID changed
      if (supplierId !== originalSupplierId && MOCK_USERS[supplierId]) {
          alert("Supplier ID already exists! Please use a unique ID.")
          return
      }

      // 1. Update Global Store
      const oldData = MOCK_USERS[originalSupplierId]
      if (oldData) {
          // If ID changed, delete old key
          if (supplierId !== originalSupplierId) {
              delete MOCK_USERS[originalSupplierId]
          }

          // Save with new ID (or update existing)
          MOCK_USERS[supplierId] = {
              ...oldData,
              id: supplierId,
              name,
              email,
              phone,
              companyDetails: {
                  address: oldData.companyDetails?.address || "N/A",
                  ...oldData.companyDetails,
                  category: category as any,
                  operationType: operation as any,
                  approvedParts: approvedPartsText.split(",").map(p => p.trim()).filter(Boolean)
              }
          }
      }

      // 2. Update Local State
      setSuppliers(suppliers.map(s => s.id === originalSupplierId ? {
          ...s,
          id: supplierId,
          name,
          category,
          email,
          phone,
          approvedParts: approvedPartsText.split(",").map(p => p.trim()).filter(Boolean)
      } : s))

      setOpen(false)
      resetForm()
  }

  const handleEditClick = (supplier: any) => {
      setIsEditing(true)
      setOriginalSupplierId(supplier.id) // Track original ID
      setSupplierId(supplier.id)
      setName(supplier.name)
      setCategory(supplier.category)
      setEmail(supplier.email)
      setPhone(supplier.phone)
      setApprovedPartsText(supplier.approvedParts ? supplier.approvedParts.join(", ") : "")
      
      // Attempt to retrieve operation type from mock if available or default
      const mockUser = MOCK_USERS[supplier.id]
      if (mockUser && mockUser.companyDetails?.operationType) {
          setOperation(mockUser.companyDetails.operationType)
      } else {
          setOperation("")
      }

      setOpen(true)
  }

  const handleDeleteClick = (id: string) => {
      setSupplierToDelete(id)
      setDeleteReason("")
      setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
      if (!supplierToDelete) return
      // 1. Remove from Global Store
      delete MOCK_USERS[supplierToDelete]
      // 2. Remove from Local State
      setSuppliers(suppliers.filter(s => s.id !== supplierToDelete))
      // 3. Log Reason (Mock log)
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
    setApprovedPartsText("")
    setIsEditing(false)
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
                            // Auto-set operation for Child-Part
                            if(val === "Child-Part") setOperation("Full Finishing");
                            else setOperation("") // Reset if switching to Pre-Machining
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

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" placeholder="contact@company.com" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="+91 ..." />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Approved Parts</Label>
                    <Textarea 
                        value={approvedPartsText} 
                        onChange={(e) => setApprovedPartsText(e.target.value)} 
                        className="col-span-3" 
                        placeholder="Comma separated (e.g. Housing A, Gear Shaft)" 
                    />
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
                   <SupplierTable data={preMachiningSuppliers} onDeleteClick={handleDeleteClick} onEditClick={handleEditClick} />
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
                   <SupplierTable data={childPartSuppliers} onDeleteClick={handleDeleteClick} onEditClick={handleEditClick} />
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
    </div>
  )
}

// Helper Component defined outside to prevent re-renders
function SupplierTable({ data, onDeleteClick, onEditClick }: { data: any[], onDeleteClick: (id: string) => void, onEditClick: (supplier: any) => void }) {
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
                      {supplier.name}
                  </div>
                </TableCell>
                <TableCell>{supplier.category}</TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {supplier.approvedParts && supplier.approvedParts.length > 0 ? (
                            supplier.approvedParts.map((part: string, idx: number) => (
                                <span key={idx} className="inline-flex items-center rounded-md border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                                    {part}
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
                       supplier.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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
