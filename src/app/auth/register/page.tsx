"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, User, Phone, Mail, Lock, MapPin, ArrowLeft, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { activateUser } from "@/lib/auth"
import Link from "next/link"
import { useLocalStorage } from "@/hooks/use-local-storage"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Connect to persistent storage to update password
  const [users, setUsers] = useLocalStorage<any[]>("users", [])

  const [formData, setFormData] = useState({
      userId: "", 
      email: "",
      password: "",
      confirmPassword: ""
  })

  // Check if we have an ID from URL? (Optional enhancement later)

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
    
    // 1. Verify credentials against our records (simulated backend check)
    const res = await activateUser(formData.userId, formData.email, formData.password)
    
    if (res.success) {
        // 2. Update persistent storage (Client-side simulation of DB update)
        // Find user and update password
        const userIndex = users.findIndex(u => u.id === formData.userId.toUpperCase())
        if (userIndex >= 0) {
            const updatedUsers = [...users]
            updatedUsers[userIndex] = { 
                ...updatedUsers[userIndex], 
                password: formData.password
            }
            setUsers(updatedUsers)
            
            alert(`Account Activated! You can now login.`)
            router.push("/auth/login")
        } else {
             // Should not happen if activateUser returned success, unless storage sync issue
             // Fallback if user is in MOCK but not in local storage yet (rare case if admin added them)
             alert("Activation successful but storage sync failed. Please contact admin.")
        }
    } else {
        alert(res.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 text-slate-100 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/auth/login" className="text-slate-400 hover:text-white"><ArrowLeft className="h-5 w-5"/></Link>
            <CardTitle className="text-2xl font-bold tracking-tight">Activate Account</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Enter your User ID received in email to set your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="userId" className="text-slate-200">User ID</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input id="userId" className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100" placeholder="e.g. SUP003" onChange={handleChange} required />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">Verify Email</Label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input id="email" type="email" className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100" placeholder="Registered Email" onChange={handleChange} required />
                    </div>
                </div>
                
                 <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">New Password</Label>
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
               
                <Button type="submit" className="w-full mt-4" disabled={loading}>
                    {loading ? "Activating..." : "Set Password & Login"}
                </Button>
            </form>
        </CardContent>
        <CardFooter className="justify-center">
             <p className="text-sm text-slate-400">Back to <Link href="/auth/login" className="text-primary hover:underline">Login</Link></p>
        </CardFooter>
      </Card>
    </div>
  )
}
