"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Building2, Phone, Mail, MoreHorizontal, Trash2, Download, Pencil } from "lucide-react"
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

import { manualActivateUser } from "@/lib/auth"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { sendEmail } from "@/lib/email"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]) 
  const [loading, setLoading] = useState(false)

  const fetchSuppliers = async () => {
      try {
          const res = await fetch('/api/suppliers');
          const data = await res.json();
          if (Array.isArray(data)) {
              const mapped = data.map((u: any) => ({
                  id: u.id,
                  name: u.name,
                  category: u.category || u.companyDetails?.category || "Unknown",
                  email: u.email || "",
                  phone: u.phone || "",
                  status: u.status,
                  approvedParts: u.companyDetails?.approvedParts || [],
                  companyDetails: u.companyDetails
              }));
              setSuppliers(mapped);
          }
      } catch (err) {
          console.error("Failed to fetch suppliers", err);
      }
  }

  useEffect(() => {
      fetchSuppliers();
  }, []);

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Form State
  const [supplierId, setSupplierId] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [operation, setOperation] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [address, setAddress] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [panNumber, setPanNumber] = useState("")
  
  // New State for Structured Parts
  const [partsList, setPartsList] = useState<any[]>([])
  const [newPartName, setNewPartName] = useState("")
  const [newPartNumber, setNewPartNumber] = useState("")
  const [newPartLine, setNewPartLine] = useState("")
  const [newPartReq, setNewPartReq] = useState("")
  const [newPartSafety, setNewPartSafety] = useState("")
  const [newPartShiftScheme, setNewPartShiftScheme] = useState("3-shifts")
  const [newPartTargetShiftA, setNewPartTargetShiftA] = useState("")
  const [newPartTargetShiftB, setNewPartTargetShiftB] = useState("")
  const [newPartTargetShiftC, setNewPartTargetShiftC] = useState("")
  const [newPartProductCode, setNewPartProductCode] = useState("")
  const [newPartDebitAllowance, setNewPartDebitAllowance] = useState("")
  const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null)

  // State for Opening Stock Dialog
  const [openingStockDialogOpen, setOpeningStockDialogOpen] = useState(false)
  const [selectedSupplierForStock, setSelectedSupplierForStock] = useState<any>(null)
  const [selectedPartForStock, setSelectedPartForStock] = useState("")
  const [stockDate, setStockDate] = useState("")
  const [openingStockValue, setOpeningStockValue] = useState("")

  const handleOpenOpeningStockDialog = (supplier: any) => {
      setSelectedSupplierForStock(supplier)
      if (supplier.approvedParts && supplier.approvedParts.length > 0) {
          setSelectedPartForStock(supplier.approvedParts[0].partNumber)
      } else {
          setSelectedPartForStock("")
      }
      setStockDate(new Date().toISOString().substring(0, 7) + "-01") // First of current month
      setOpeningStockValue("")
      setOpeningStockDialogOpen(true)
  }

  const handleSaveOpeningStock = async () => {
      if (!selectedSupplierForStock || !selectedPartForStock || !stockDate || !openingStockValue) {
          alert("Please fill in all opening stock fields.")
          return
      }
      
      const part = selectedSupplierForStock.approvedParts.find((p: any) => p.partNumber === selectedPartForStock)

      try {
          const res = await fetch('/api/production', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  supplierId: selectedSupplierForStock.id,
                  partNumber: selectedPartForStock,
                  productionLine: part?.productionLine || "Line-1",
                  date: stockDate,
                  openingStock: Number(openingStockValue),
                  isOpeningStockRecord: true
              })
          })

          const result = await res.json()
          if (result.success) {
              alert("Monthly Opening Stock saved successfully.")
              setOpeningStockDialogOpen(false)
          } else {
              alert(`Failed to save: ${result.message}`)
          }
      } catch (err) {
          console.error(err)
          alert("An error occurred while saving opening stock.")
      }
  }

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

  const handleSendEmail = async () => {
    // Construct Email Content
    const subject = emailSubject
    const message = emailMessage
    
    // Attempt Automation
    const result = await sendEmail(
        selectedSupplierName,
        selectedSupplierEmail,
        message,
        subject
    )

    if (result.success) {
        alert("Email sent successfully!")
    } else {
        alert(`Failed to send email: ${result.error}`)
    }

    setEmailDialogOpen(false)
    setEmailSubject("")
    setEmailMessage("")
  }

  const handleActivateSupplier = async (id: string) => {
      const res = await manualActivateUser(id)
      if (res.success) {
          await fetchSuppliers()
          alert(`Supplier ${id} activated successfully.`)
      } else {
          alert(res.message || "Failed to activate supplier.")
      }
  }
  
  const handleAddSupplier = async () => {
    if (isEditing) {
        handleUpdateSupplier()
        return
    }

    setLoading(true)
    try {
        const response = await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: supplierId,
                name,
                category,
                email,
                phone,
                contactPerson,
                address,
                gstNumber,
                panNumber,
                companyDetails: { 
                    operationType: operation,
                    approvedParts: partsList
                }
            })
        });

        const result = await response.json();
        if (result.success) {
            await fetchSuppliers();
            setOpen(false)
            
            // Send welcome email if EmailJS is configured
            const emailSubject = "Welcome to SAKTHI Partner Hub - Account Activation";
            const emailMessage = `Dear ${name},\n\nYou have been registered as a supplier on the SAKTHI Partner Hub.\n\nHere are your access credentials:\n- **Supplier ID / User ID**: ${result.supplier.id}\n- **Temporary Password**: ${result._debug_tempPassword}\n\nPlease activate your account by visiting the portal at https://supplier-portal-kappa.vercel.app/auth/login and selecting 'Activate Account' to set your permanent password.\n\nBest regards,\nSAKTHI AUTO COMPONENTS LIMITED`;
            
            const emailRes = email ? await sendEmail(name, email, emailMessage, emailSubject) : { success: false, isSimulation: true };
            resetForm()
            
            if (email && emailRes.success && !emailRes.isSimulation) {
                alert(`Supplier Created Successfully!\nID: ${result.supplier.id}\nTemp Password: ${result._debug_tempPassword}\n\nWelcome email sent to ${email} successfully!`);
            } else {
                alert(`Supplier Created Successfully!\nID: ${result.supplier.id}\nTemp Password: ${result._debug_tempPassword}\n\nSupplier credentials generated successfully.`);
            }
        } else {
            alert(`Failed: ${result.message}`);
        }
    } catch (error) {
        console.error("Creation failed", error);
        alert("An error occurred during creation.");
    } finally {
        setLoading(false)
    }
  }

  const handleUpdateSupplier = async () => {
      setLoading(true)
      try {
          const response = await fetch('/api/suppliers', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  id: supplierId,
                  name,
                  category,
                  email,
                  phone,
                  contactPerson,
                  address,
                  gstNumber,
                  panNumber,
                  companyDetails: {
                      operationType: operation,
                      approvedParts: partsList
                  }
              })
          });
          const result = await response.json();
          if (result.success) {
              await fetchSuppliers();
              setOpen(false)
              resetForm()
              alert("Supplier details updated successfully.");
          } else {
              alert(`Update failed: ${result.message}`);
          }
      } catch (err) {
          console.error(err);
          alert("An error occurred during update.");
      } finally {
          setLoading(false);
      }
  }

  const handleEditClick = (supplier: any) => {
      setIsEditing(true)
      setOriginalSupplierId(supplier.id) 
      setSupplierId(supplier.id)
      setName(supplier.name)
      setCategory(supplier.category || supplier.companyDetails?.category)
      setEmail(supplier.email)
      setPhone(supplier.phone)
      setContactPerson(supplier.contactPerson || "")
      setAddress(supplier.address || "")
      setGstNumber(supplier.gstNumber || "")
      setPanNumber(supplier.panNumber || "")
      
      const parts = supplier.approvedParts || supplier.companyDetails?.approvedParts || []
      setPartsList(parts)
       // setApprovedPartsText(parts.join(", ")) - removed
       
      setOperation(supplier.companyDetails?.operationType || "") 
      setOpen(true)
  }

  const handleDeleteClick = (id: string) => {
      setSupplierToDelete(id)
      setDeleteReason("")
      setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
      if (!supplierToDelete) return
      setLoading(true)
      try {
          const response = await fetch(`/api/suppliers?id=${supplierToDelete}`, {
              method: 'DELETE'
          });
          const result = await response.json();
          if (result.success) {
              await fetchSuppliers();
              alert(`Supplier ${supplierToDelete} deleted successfully.`);
          } else {
              alert(`Delete failed: ${result.message}`);
          }
      } catch (err) {
          console.error(err);
          alert("An error occurred during deletion.");
      } finally {
          setLoading(false);
          setDeleteDialogOpen(false);
          setSupplierToDelete(null);
      }
  }

  const resetForm = () => {
    setSupplierId("")
    setOriginalSupplierId("")
    setName("")
    setCategory("")
    setOperation("")
    setEmail("")
    setPhone("")
    setContactPerson("")
    setAddress("")
    setGstNumber("")
    setPanNumber("")
    setPartsList([])
    setNewPartName("")
    setNewPartNumber("")
    setNewPartLine("")
    setNewPartProductCode("")
    setNewPartDebitAllowance("")
    setNewPartReq("")
    setNewPartSafety("")
    setNewPartShiftScheme("3-shifts")
    setNewPartTargetShiftA("")
    setNewPartTargetShiftB("")
    setNewPartTargetShiftC("")
    setEditingPartIndex(null)
    setIsEditing(false)
  }

  const handleAddPart = () => {
      if(newPartName && newPartNumber) {
          setPartsList([...partsList, { 
              name: newPartName, 
              partNumber: newPartNumber,
              productionLine: newPartLine || "Line-1",
              productCode: newPartProductCode,
              debitAllowance: Number(newPartDebitAllowance) || 0,
              monthlyRequirement: Number(newPartReq) || 0,
              safetyStockLevel: Number(newPartSafety) || 0,
              shiftScheme: newPartShiftScheme,
              shiftTargets: {
                  shiftA: Number(newPartTargetShiftA) || 0,
                  shiftB: Number(newPartTargetShiftB) || 0,
                  shiftC: newPartShiftScheme === "3-shifts" ? (Number(newPartTargetShiftC) || 0) : 0
              }
          }])
          setNewPartName("")
          setNewPartNumber("")
          setNewPartLine("")
          setNewPartProductCode("")
          setNewPartDebitAllowance("")
          setNewPartReq("")
          setNewPartSafety("")
          setNewPartShiftScheme("3-shifts")
          setNewPartTargetShiftA("")
          setNewPartTargetShiftB("")
          setNewPartTargetShiftC("")
      }
  }

  const handleEditPartClick = (index: number) => {
      const part = partsList[index]
      setEditingPartIndex(index)
      setNewPartName(part.name || "")
      setNewPartNumber(part.partNumber || "")
      setNewPartLine(part.productionLine || "")
      setNewPartProductCode(part.productCode || "")
      setNewPartDebitAllowance(part.debitAllowance?.toString() || "")
      setNewPartReq(part.monthlyRequirement?.toString() || "")
      setNewPartSafety(part.safetyStockLevel?.toString() || "")
      setNewPartShiftScheme(part.shiftScheme || "3-shifts")
      setNewPartTargetShiftA(part.shiftTargets?.shiftA?.toString() || "")
      setNewPartTargetShiftB(part.shiftTargets?.shiftB?.toString() || "")
      setNewPartTargetShiftC(part.shiftTargets?.shiftC?.toString() || "")
  }

  const handleUpdatePart = () => {
      if (editingPartIndex === null) return
      if (newPartName && newPartNumber) {
          const newList = [...partsList]
          newList[editingPartIndex] = {
              name: newPartName, 
              partNumber: newPartNumber,
              productionLine: newPartLine || "Line-1",
              productCode: newPartProductCode,
              debitAllowance: Number(newPartDebitAllowance) || 0,
              monthlyRequirement: Number(newPartReq) || 0,
              safetyStockLevel: Number(newPartSafety) || 0,
              shiftScheme: newPartShiftScheme,
              shiftTargets: {
                  shiftA: Number(newPartTargetShiftA) || 0,
                  shiftB: Number(newPartTargetShiftB) || 0,
                  shiftC: newPartShiftScheme === "3-shifts" ? (Number(newPartTargetShiftC) || 0) : 0
              }
          }
          setPartsList(newList)
          setEditingPartIndex(null)
          setNewPartName("")
          setNewPartNumber("")
          setNewPartLine("")
          setNewPartProductCode("")
          setNewPartDebitAllowance("")
          setNewPartReq("")
          setNewPartSafety("")
          setNewPartShiftScheme("3-shifts")
          setNewPartTargetShiftA("")
          setNewPartTargetShiftB("")
          setNewPartTargetShiftC("")
      }
  }

  const handleCancelPartEdit = () => {
      setEditingPartIndex(null)
      setNewPartName("")
      setNewPartNumber("")
      setNewPartLine("")
      setNewPartProductCode("")
      setNewPartDebitAllowance("")
      setNewPartReq("")
      setNewPartSafety("")
      setNewPartShiftScheme("3-shifts")
      setNewPartTargetShiftA("")
      setNewPartTargetShiftB("")
      setNewPartTargetShiftC("")
  }

  const handleRemovePart = (index: number) => {
      const newList = [...partsList]
      newList.splice(index, 1)
      setPartsList(newList)
      if (editingPartIndex === index) {
          handleCancelPartEdit()
      } else if (editingPartIndex !== null && editingPartIndex > index) {
          setEditingPartIndex(editingPartIndex - 1)
      }
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
              <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>{isEditing ? "Edit Supplier Details" : "Add New Supplier"}</DialogTitle>
                  <DialogDescription>
                    {isEditing ? "Update supplier profile information." : "Create a new supplier profile and generate access credentials."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4 overflow-y-auto pr-6 -mr-6 px-1 flex-1">
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="supplierId" className="text-right">Supplier Code (User ID)</Label>
                     <Input 
                        id="supplierId" 
                        value={supplierId} 
                        onChange={(e) => setSupplierId(e.target.value)} 
                        disabled={isEditing} 
                        className="col-span-3 font-mono uppercase" 
                        placeholder={isEditing ? "" : "e.g. SUP-0001"} 
                        required
                     />
                   </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Supplier Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="e.g. SAKTHI Castings Ltd" />
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
                  
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="address" className="text-right pt-2">Address</Label>
                    <Textarea 
                        id="address" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        className="col-span-3" 
                        placeholder="Full Registered Office Address" 
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact" className="text-right">Contact Person</Label>
                    <Input id="contact" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="col-span-3" placeholder="Full Name" />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email ID</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" placeholder="contact@supplier.com" />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Mobile Number</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="+91 98765 43210" />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gst" className="text-right">GST Number</Label>
                    <Input id="gst" value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase())} className="col-span-3" placeholder="22AAAAA0000A1Z5" />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pan" className="text-right">PAN Number</Label>
                    <Input id="pan" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} className="col-span-3" placeholder="ABCDE1234F" />
                  </div>

                  {category && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Operation</Label>
                        <div className="col-span-3">
                           <Select value={operation} onValueChange={setOperation} disabled={category === "Child-Part"}>
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

                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">Approved Components</Label>
                      <div className="col-span-3 space-y-3">
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-md border border-slate-200">
                              <Input 
                                  placeholder="Part Name" 
                                  value={newPartName}
                                  onChange={(e) => setNewPartName(e.target.value)}
                                  className="bg-white"
                              />
                              <Input 
                                  placeholder="Part No" 
                                  value={newPartNumber}
                                  onChange={(e) => setNewPartNumber(e.target.value)}
                                  className="bg-white"
                              />
                              <Input 
                                  placeholder="Production Line (e.g. Line-1)" 
                                  value={newPartLine}
                                  onChange={(e) => setNewPartLine(e.target.value)}
                                  className="bg-white"
                              />
                              <Input 
                                  placeholder="Product Code (Internal)" 
                                  value={newPartProductCode}
                                  onChange={(e) => setNewPartProductCode(e.target.value)}
                                  className="bg-white"
                              />
                              <Input 
                                  type="number"
                                  placeholder="Debit Allowance (e.g. 50)" 
                                  value={newPartDebitAllowance}
                                  onChange={(e) => setNewPartDebitAllowance(e.target.value)}
                                  className="bg-white"
                              />
                              <Input 
                                  type="number"
                                  placeholder="Monthly Req (e.g. 5000)" 
                                  value={newPartReq}
                                  onChange={(e) => setNewPartReq(e.target.value)}
                                  className="bg-white"
                              />
                              <Input 
                                  type="number"
                                  placeholder="Safety Stock (e.g. 500)" 
                                  value={newPartSafety}
                                  onChange={(e) => setNewPartSafety(e.target.value)}
                                  className="bg-white"
                              />
                              <Select value={newPartShiftScheme} onValueChange={setNewPartShiftScheme}>
                                  <SelectTrigger className="bg-white">
                                      <SelectValue placeholder="Select Shifts System" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="3-shifts">3 Shifts (8 hrs/shift)</SelectItem>
                                      <SelectItem value="2-shifts">2 Shifts (12 hrs/shift)</SelectItem>
                                  </SelectContent>
                              </Select>
                              
                              <div className="col-span-2 border-t pt-2 mt-1">
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Shift-wise Production Target Qty</Label>
                                  <div className="grid grid-cols-3 gap-2">
                                      <div className="grid gap-0.5">
                                          <Label className="text-[9px] text-slate-400">Shift A</Label>
                                          <Input 
                                              type="number" 
                                              placeholder="Target Qty" 
                                              value={newPartTargetShiftA} 
                                              onChange={(e) => setNewPartTargetShiftA(e.target.value)}
                                              className="h-8 text-xs bg-white"
                                          />
                                      </div>
                                      <div className="grid gap-0.5">
                                          <Label className="text-[9px] text-slate-400">Shift B</Label>
                                          <Input 
                                              type="number" 
                                              placeholder="Target Qty" 
                                              value={newPartTargetShiftB} 
                                              onChange={(e) => setNewPartTargetShiftB(e.target.value)}
                                              className="h-8 text-xs bg-white"
                                          />
                                      </div>
                                      {newPartShiftScheme === "3-shifts" && (
                                          <div className="grid gap-0.5">
                                              <Label className="text-[9px] text-slate-400">Shift C</Label>
                                              <Input 
                                                  type="number" 
                                                  placeholder="Target Qty" 
                                                  value={newPartTargetShiftC} 
                                                  onChange={(e) => setNewPartTargetShiftC(e.target.value)}
                                                  className="h-8 text-xs bg-white"
                                              />
                                          </div>
                                      )}
                                  </div>
                              </div>

                              {editingPartIndex !== null ? (
                                  <div className="col-span-2 grid grid-cols-2 gap-2 mt-2">
                                      <Button type="button" size="sm" onClick={handleUpdatePart} className="bg-green-600 hover:bg-green-500 text-white font-semibold">Update Component</Button>
                                      <Button type="button" size="sm" variant="outline" onClick={handleCancelPartEdit}>Cancel Edit</Button>
                                  </div>
                              ) : (
                                  <Button type="button" size="sm" onClick={handleAddPart} className="col-span-2 mt-2">Add Component</Button>
                              )}
                         </div>
                         
                         {partsList.length > 0 && (
                             <div className="border rounded-md p-2 bg-slate-50 space-y-1">
                                 {partsList.map((part: any, idx) => (
                                     <div key={idx} className="flex justify-between items-center text-xs p-1 border-b last:border-0">
                                         <div>
                                             <b>{part.name}</b> <span className="text-slate-500">({part.partNumber})</span>
                                             <div className="text-[10px] text-slate-400">
                                                  Line: {part.productionLine || "Line-1"} | Prod Code: {part.productCode || "-"} | Debit Allow: {part.debitAllowance || 0}
                                              </div>
                                              <div className="text-[10px] text-slate-400">
                                                  Req: {part.monthlyRequirement || 0} | Safety: {part.safetyStockLevel || 0}
                                              </div>
                                             <div className="text-[9px] text-primary font-medium">
                                                  Shifts: {part.shiftScheme === "2-shifts" ? "2 Shifts (12h)" : "3 Shifts (8h)"} | Targets: A={part.shiftTargets?.shiftA || 0}, B={part.shiftTargets?.shiftB || 0}
                                                  {part.shiftScheme !== "2-shifts" && `, C=${part.shiftTargets?.shiftC || 0}`}
                                              </div>
                                         </div>
                                         <div className="flex items-center gap-1">
                                             <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-slate-900" onClick={() => handleEditPartClick(idx)}>
                                                 <Pencil className="h-3 w-3" />
                                             </Button>
                                             <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={() => handleRemovePart(idx)}>
                                                 <Trash2 className="h-3 w-3" />
                                             </Button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                      </div>
                    </div>
                </div>
                <DialogFooter className="border-t pt-4">
                  <Button 
                    onClick={handleAddSupplier} 
                    disabled={!supplierId || !name || !category}
                    className="bg-primary hover:bg-orange-600 text-white w-full sm:w-auto"
                  >
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
                    <SupplierTable 
                       data={preMachiningSuppliers} 
                       onDeleteClick={handleDeleteClick} 
                       onEditClick={handleEditClick} 
                       onEmailClick={handleOpenEmailDialog} 
                       onActivateClick={handleActivateSupplier} 
                       onOpeningStockClick={handleOpenOpeningStockDialog}
                    />
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
                    <SupplierTable 
                       data={childPartSuppliers} 
                       onDeleteClick={handleDeleteClick} 
                       onEditClick={handleEditClick} 
                       onEmailClick={handleOpenEmailDialog} 
                       onActivateClick={handleActivateSupplier} 
                       onOpeningStockClick={handleOpenOpeningStockDialog}
                    />
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

      {/* Monthly Opening Stock Dialog */}
      <Dialog open={openingStockDialogOpen} onOpenChange={setOpeningStockDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>Enter Monthly Opening Stock</DialogTitle>
                  <DialogDescription>
                      Enter opening stock level for <b>{selectedSupplierForStock?.name}</b> components.
                  </DialogDescription>
              </DialogHeader>
              {selectedSupplierForStock && (
                  <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                           <Label htmlFor="partSelect">Select Part Number</Label>
                           <Select value={selectedPartForStock} onValueChange={setSelectedPartForStock}>
                               <SelectTrigger id="partSelect">
                                   <SelectValue placeholder="Choose a part" />
                               </SelectTrigger>
                               <SelectContent>
                                   {selectedSupplierForStock.approvedParts && selectedSupplierForStock.approvedParts.map((part: any, i: number) => (
                                       <SelectItem key={i} value={part.partNumber}>
                                           {part.name} ({part.partNumber}) - Line: {part.productionLine || "Line-1"}
                                       </SelectItem>
                                   ))}
                               </SelectContent>
                           </Select>
                      </div>
                      <div className="grid gap-2">
                           <Label htmlFor="stockDate">Opening Stock Date</Label>
                           <Input 
                              id="stockDate" 
                              type="date"
                              value={stockDate}
                              onChange={(e) => setStockDate(e.target.value)}
                           />
                           <p className="text-[10px] text-muted-foreground">Select the 1st of the month for which opening stock applies.</p>
                      </div>
                      <div className="grid gap-2">
                           <Label htmlFor="openingStockValue">Opening Stock Quantity</Label>
                           <Input 
                              id="openingStockValue" 
                              type="number"
                              placeholder="e.g. 1000"
                              value={openingStockValue}
                              onChange={(e) => setOpeningStockValue(e.target.value)}
                           />
                      </div>
                  </div>
              )}
              <DialogFooter>
                  <Button variant="outline" onClick={() => setOpeningStockDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveOpeningStock} className="bg-primary hover:bg-orange-600 text-white" disabled={!selectedPartForStock || !stockDate || !openingStockValue}>
                      Save Opening Stock
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Component defined outside to prevent re-renders
function SupplierTable({ data, onDeleteClick, onEditClick, onEmailClick, onActivateClick, onOpeningStockClick }: { data: any[], onDeleteClick: (id: string) => void, onEditClick: (supplier: any) => void, onEmailClick: (supplier: any) => void, onActivateClick: (id: string) => void, onOpeningStockClick: (supplier: any) => void }) {
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
                          {supplier.status === 'Pending Activation' && (
                              <DropdownMenuItem onClick={() => onActivateClick(supplier.id)} className="text-green-600 focus:text-green-600">
                                  Activate Account
                              </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onEditClick(supplier)}>
                              Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onOpeningStockClick(supplier)}>
                               Enter Opening Stock
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
