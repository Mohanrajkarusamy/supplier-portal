"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, User, Phone, Mail, Lock, MapPin, ArrowLeft, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { activateUser } from "@/lib/auth"
import Link from "next/link"


export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
      userId: "", 
      email: "",
      password: "",
      confirmPassword: ""
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const uId = params.get('userId') || ""
      const emailParam = params.get('email') || ""
      setFormData(prev => ({
        ...prev,
        userId: uId,
        email: emailParam
      }))
    }
  }, [])

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
        alert(`Account Activated! You can now login.`)
        router.push("/auth/login")
    } else {
        alert(res.message)
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Premium ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <Card className="w-full max-w-md border border-slate-800 bg-slate-900/65 text-slate-100 shadow-2xl backdrop-blur-xl relative z-10">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/auth/login" className="text-slate-400 hover:text-white"><ArrowLeft className="h-5 w-5"/></Link>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Activate Account</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Enter your User ID received in email to set your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="userId" className="text-slate-300 font-medium">User ID</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                        <Input id="userId" value={formData.userId} className="pl-9 bg-slate-950/40 border-slate-800 focus:border-primary text-slate-100 placeholder:text-slate-600 h-11" placeholder="e.g. SUP003" onChange={handleChange} required />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300 font-medium">Verify Email</Label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                        <Input id="email" type="email" value={formData.email} className="pl-9 bg-slate-950/40 border-slate-800 focus:border-primary text-slate-100 placeholder:text-slate-600 h-11" placeholder="Registered Email" onChange={handleChange} required />
                     </div>
                </div>
                
                 <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300 font-medium">New Password</Label>
                     <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                        <Input id="password" type="password" value={formData.password} className="pl-9 bg-slate-950/40 border-slate-800 focus:border-primary text-slate-100 placeholder:text-slate-600 h-11" placeholder="******" onChange={handleChange} required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-300 font-medium">Confirm Password</Label>
                     <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                        <Input id="confirmPassword" type="password" value={formData.confirmPassword} className="pl-9 bg-slate-950/40 border-slate-800 focus:border-primary text-slate-100 placeholder:text-slate-600 h-11" placeholder="******" onChange={handleChange} required />
                    </div>
                </div>
               
                <Button type="submit" className="w-full mt-4 bg-white text-slate-950 hover:bg-slate-200 font-semibold h-11" disabled={loading}>
                    {loading ? "Activating..." : "Set Password & Login"}
                </Button>
            </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-800/60 pt-4 pb-6">
             <p className="text-sm text-slate-500">Back to <Link href="/auth/login" className="text-primary hover:text-orange-400 hover:underline">Login</Link></p>
        </CardFooter>
      </Card>
    </div>
  )
}
