"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Truck, ArrowRight, Loader2, Lock, User as UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { checkUser, sendOTP, verifyOTP, verifyPassword } from "@/lib/auth"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [maskedEmail, setMaskedEmail] = useState("")
  const [step, setStep] = useState<"ID" | "PASSWORD" | "OTP">("ID")
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCheckUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const res = await checkUser(userId)
      if (res.exists) {
        setStep("PASSWORD")
      } else {
        setError("User ID not found. Please register first.")
      }
    } catch (err) {
      setError("Failed to check user.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
        const res = await verifyPassword(userId, password)
        if (res.success) {
             // Bypass OTP for Admin
             if (res.user?.role === "ADMIN") {
                 localStorage.setItem("currentUserId", res.user.id)
                 router.push("/dashboard/admin")
                 return
             }

             // Password OK, now send OTP for non-admins
             const otpRes = await sendOTP(userId)
             if (otpRes.success) {
                setStep("OTP")
                // Simulate Email
                alert(`Simulating Email to ${otpRes.email}:\n\nSubject: Supplier Portal Login OTP\n\nYour One-Time Password is: 1234`)
                
                // Mask email for UI
                if (otpRes.email) {
                    const [user, domain] = otpRes.email.split("@")
                    setMaskedEmail(`${user.slice(0, 3)}***@${domain}`)
                }
             } else {
                setError(otpRes.message)
             }
        } else {
            setError(res.message)
        }
    } catch(err) {
        setError("Authentication failed.")
    } finally {
        setLoading(false)
    }
  }



  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await verifyOTP(userId, otp)
      if (res.success && res.user) {
        // Redirect based on role
        localStorage.setItem("currentUserId", res.user.id) // Persist session
        if (res.user.role === "ADMIN") {
          router.push("/dashboard/admin")
        } else {
          router.push("/dashboard/supplier")
        }
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError("Verification failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 text-slate-100 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Supplier Portal</CardTitle>
          <CardDescription className="text-slate-400">
            Secure access for Suppliers & Admins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "ID" && (
            <form onSubmit={handleCheckUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-slate-200">User ID</Label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                    id="userId"
                    placeholder="Enter your User ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100 focus:ring-primary placeholder:text-slate-500"
                    required
                    />
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading} onClick={handleCheckUser}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {step === "PASSWORD" && (
            <form onSubmit={handleVerifyPassword} className="space-y-4">
               <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-slate-200">Password</Label>
                    <Button 
                        variant="link" 
                        className="h-auto p-0 text-xs text-primary"
                        onClick={() => setStep("ID")}
                        type="button"
                    >
                        Change User ID
                    </Button>
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100 focus:ring-primary placeholder:text-slate-500"
                        required
                    />
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify Password <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="text-center">
                 <Link href="#" className="text-xs text-slate-500 hover:text-slate-300">Forgot Password?</Link>
              </div>
            </form>
          )}

          {step === "OTP" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
               <div className="space-y-2">
                <div className="flex justify-between items-center">
                     <Label htmlFor="otp" className="text-slate-200">Enter OTP</Label>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-xs text-primary"
                        onClick={() => setStep("PASSWORD")}
                        type="button"
                    >
                        Back
                    </Button>
                </div>
                {maskedEmail && <p className="text-xs text-slate-400">Sent to {maskedEmail}</p>}
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                    id="otp"
                    type="text"
                    placeholder="1234"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100 focus:ring-primary placeholder:text-slate-500 tracking-widest"
                    required
                    maxLength={6}
                    />
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify & Login
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4 justify-center border-t border-slate-700/50 pt-4">
          {step === "ID" && (
              <p className="text-sm text-slate-400">
                Received Invite? <Link href="/auth/register" className="text-primary hover:underline font-semibold">Activate Account</Link>
              </p>
          )}
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Truck className="h-3 w-3" /> Automobile Components Co.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
