"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, User, Phone, Mail, Lock, MapPin, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { registerUser } from "@/lib/auth"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
      name: "",
      address: "",
      userId: "", // Typically assigned, but for this flow letting them choose or assign logic
      password: "",
      confirmPassword: "",
      email: "",
      phone: ""
  })

  // For this demo, we will auto-generate ID or let them propose one? 
  // Requirement says: "Admin should access the supplier register form" -> Wait, admin creates it? 
  // "Each and every supplier must register to get ID and password." -> This implies self-registration or admin-assisted. 
  // Given "Register form will be contains... Admin should access... and whenever login... supplier to get ID"
  // Let's assume Self-Registration for now as per "Each supplier must register", but Approved by Admin later ideally.
  // We will allow them to creates a profile.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match")
        return
    }

    setLoading(true)
    // Register
    const res = await registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        companyDetails: { address: formData.address }
    })
    
    if (res.success) {
        alert(`Registration Successful! Your User ID is ${res.userId}. Please use this to login.`)
        router.push("/auth/login")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-lg border-slate-700 bg-slate-800/50 text-slate-100 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/auth/login" className="text-slate-400 hover:text-white"><ArrowLeft className="h-5 w-5"/></Link>
            <CardTitle className="text-2xl font-bold tracking-tight">Supplier Registration</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Create your account to access the Supplier Portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">Company Name</Label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input id="name" className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100" placeholder="e.g. Fast Machining Ltd" onChange={handleChange} required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address" className="text-slate-200">Company Address</Label>
                     <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input id="address" className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100" placeholder="Full Address" onChange={handleChange} required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-200">Mail ID</Label>
                         <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input id="email" type="email" className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100" placeholder="contact@company.com" onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-200">Phone No</Label>
                         <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input id="phone" className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100" placeholder="+91..." onChange={handleChange} required />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-200">Password</Label>
                         <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input id="password" type="password" className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100" placeholder="******" onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
                         <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input id="confirmPassword" type="password" className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100" placeholder="******" onChange={handleChange} required />
                        </div>
                    </div>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={loading}>
                    {loading ? "Registering..." : "Register Company"}
                </Button>
            </form>
        </CardContent>
        <CardFooter className="justify-center">
             <p className="text-sm text-slate-400">Already have an ID? <Link href="/auth/login" className="text-primary hover:underline">Login here</Link></p>
        </CardFooter>
      </Card>
    </div>
  )
}
