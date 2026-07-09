"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Truck, ArrowRight, Loader2, Lock, User as UserIcon, AlertTriangle, Key } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { checkUser, sendOTP, verifyOTP, verifyPassword, resetPassword } from "@/lib/auth"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [maskedEmail, setMaskedEmail] = useState("")
  const [step, setStep] = useState<"ID" | "PASSWORD" | "OTP" | "FORGOT">("ID")
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
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
      } else if (res.message) {
        setError(`${res.message}. Please configure MONGODB_URI in Vercel settings for cloud database connection.`);
      } else {
        setError("User ID not found. Please register first.")
      }
    } catch (err) {
      setError("Failed to check user. Connection failed.")
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
        if (res.success && res.user) {
             localStorage.setItem("currentUserId", res.user.id)
             if (res.user.status === "Pending Activation") {
                 router.push(`/auth/register?userId=${res.user.id}&email=${res.user.email}`)
                 return
             }
             if (res.user.role === "SUPER_ADMIN" || res.user.role === "SQA_ADMIN") {
                 router.push("/dashboard/admin")
             } else {
                 router.push("/dashboard/supplier")
             }
        } else if (res.expired) {
            setError("PASSWORD_EXPIRED")
        } else {
            setError(res.message || "Authentication failed")
        }
    } catch(err) {
        setError("Authentication failed.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPasswordRequest = async () => {
    setLoading(true)
    setError("")
    try {
        const otpRes = await sendOTP(userId)
        if (otpRes.success) {
            setStep("FORGOT")
            if (otpRes.email) {
                const [user, domain] = otpRes.email.split("@")
                setMaskedEmail(`${user.slice(0, 3)}***@${domain}`)
            }
        } else {
            setError(otpRes.message || "Failed to send reset OTP.")
        }
    } catch(err) {
        setError("Failed to send OTP.")
    } finally {
        setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
        setError("Passwords do not match")
        return
    }
    setLoading(true)
    setError("")

    try {
        const res = await resetPassword(userId, otp, newPassword)
        if (res.success) {
            alert("Password reset successfully. You can now login with your new password.")
            setNewPassword("")
            setConfirmPassword("")
            setOtp("")
            setPassword("") // Clear password field
            setStep("PASSWORD")
        } else {
            setError(res.message || "Failed to reset password.")
        }
    } catch (err) {
        setError("Error resetting password.")
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
        localStorage.setItem("currentUserId", res.user.id)
        if (res.user.status === "Pending Activation") {
          router.push(`/auth/register?userId=${res.user.id}&email=${res.user.email}`)
          return
        }
        if (res.user.role === "SUPER_ADMIN" || res.user.role === "SQA_ADMIN") {
          router.push("/dashboard/admin")
        } else {
          router.push("/dashboard/supplier")
        }
      } else {
        setError(res.message || "Invalid OTP")
      }
    } catch (err) {
      setError("Verification failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Premium ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <Card className="w-full max-w-md border border-slate-800/80 bg-slate-900/65 text-slate-100 shadow-2xl backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
              <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white uppercase">SAKTHI Partner Hub</CardTitle>
          <CardDescription className="text-slate-400 font-medium">
            One Platform for Supplier Collaboration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error === "PASSWORD_EXPIRED" ? (
              <div className="space-y-4 text-center py-4">
                  <div className="bg-amber-950/30 border border-amber-900/60 p-4 rounded-lg">
                      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-amber-200">Password Expired</p>
                      <p className="text-xs text-amber-400 mt-1">Your password is more than 90 days old and must be reset for security reasons.</p>
                  </div>
                  <Button onClick={() => router.push(`/auth/register?userId=${userId}`)} className="w-full bg-primary hover:bg-orange-600 text-white">Reset Password Now</Button>
                  <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-300" onClick={() => { setError(""); setStep("ID"); }}>Back to Login</Button>
              </div>
          ) : (
            <>
                {step === "ID" && (
                     <form onSubmit={handleCheckUser} className="space-y-4">
                     <div className="space-y-2">
                         <Label htmlFor="userId" className="font-bold text-slate-300">User ID / Username</Label>
                         <div className="relative">
                             <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                             <Input
                                 id="userId"
                                 placeholder="SUP-0001"
                                 value={userId}
                                 onChange={(e) => setUserId(e.target.value)}
                                 className="pl-9 bg-slate-950/40 border-slate-800 focus:border-primary text-slate-100 placeholder:text-slate-600 h-11"
                                 required
                             />
                         </div>
                     </div>
                     {error && <p className="text-sm font-medium text-red-400 bg-red-950/20 p-2 rounded border border-red-900/50">{error}</p>}
                     <Button type="submit" className="w-full h-11 bg-white text-slate-950 hover:bg-slate-200 font-semibold" disabled={loading}>
                         {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                         Continue <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                     </form>
                )}

                {step === "PASSWORD" && (
                     <form onSubmit={handleVerifyPassword} className="space-y-4">
                     <div className="space-y-2">
                         <div className="flex justify-between items-center">
                             <Label htmlFor="password" title={`Current ID: ${userId}`} className="font-bold text-slate-300">Password</Label>
                             <div className="flex items-center space-x-1.5">
                                 <Button variant="link" className="h-auto p-0 text-xs text-primary hover:text-orange-400 font-medium" onClick={handleForgotPasswordRequest} type="button">Forgot Password?</Button>
                                 <span className="text-slate-700 text-xs">|</span>
                                 <Button variant="link" className="h-auto p-0 text-xs text-slate-400 hover:text-slate-300" onClick={() => setStep("ID")} type="button">Change ID</Button>
                             </div>
                         </div>
                         <div className="relative">
                             <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                             <Input
                                 id="password"
                                 type="password"
                                 placeholder="••••••••"
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                                 className="pl-9 bg-slate-950/40 border-slate-800 focus:border-primary text-slate-100 placeholder:text-slate-600 h-11"
                                 required
                             />
                         </div>
                     </div>
                     {error && <p className="text-sm font-medium text-red-400 bg-red-950/20 p-2 rounded border border-red-900/50">{error}</p>}
                     <Button type="submit" className="w-full h-11 bg-white text-slate-950 hover:bg-slate-200 font-semibold" disabled={loading}>
                         {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                         Secure Login <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                     </form>
                )}

                {step === "FORGOT" && (
                     <form onSubmit={handleResetPassword} className="space-y-4">
                     <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-center">
                         <Key className="h-8 w-8 text-primary mx-auto mb-2" />
                         <p className="text-sm font-bold text-slate-200">Password Reset Request</p>
                         {maskedEmail && <p className="text-xs text-slate-400 mt-1">A verification code has been sent to {maskedEmail}</p>}
                     </div>

                     <div className="space-y-2">
                         <Label htmlFor="otp" className="font-bold text-slate-300">Enter OTP</Label>
                         <Input
                             id="otp"
                             placeholder="0000"
                             value={otp}
                             onChange={(e) => setOtp(e.target.value)}
                             className="bg-slate-950/40 border-slate-800 focus:border-primary text-slate-100 placeholder:text-slate-700 h-11 text-center font-bold tracking-widest text-lg"
                             required
                             maxLength={4}
                         />
                     </div>

                     <div className="space-y-2">
                         <Label htmlFor="newPassword" className="font-bold text-slate-300">New Password</Label>
                         <Input
                             id="newPassword"
                             type="password"
                             placeholder="••••••••"
                             value={newPassword}
                             onChange={(e) => setNewPassword(e.target.value)}
                             className="bg-slate-950/40 border-slate-800 focus:border-primary text-slate-100 placeholder:text-slate-600 h-11"
                             required
                         />
                     </div>

                     <div className="space-y-2">
                         <Label htmlFor="confirmPassword" className="font-bold text-slate-300">Confirm New Password</Label>
                         <Input
                             id="confirmPassword"
                             type="password"
                             placeholder="••••••••"
                             value={confirmPassword}
                             onChange={(e) => setConfirmPassword(e.target.value)}
                             className="bg-slate-950/40 border-slate-800 focus:border-primary text-slate-100 placeholder:text-slate-600 h-11"
                             required
                         />
                     </div>

                     {error && <p className="text-sm font-medium text-red-400 bg-red-950/20 p-2 rounded border border-red-900/50">{error}</p>}
                     <Button type="submit" className="w-full h-11 bg-white text-slate-950 hover:bg-slate-200 font-semibold" disabled={loading}>
                         {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                         Reset & Update Password <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                     <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-300" onClick={() => setStep("PASSWORD")} type="button">Back</Button>
                     </form>
                )}

                {step === "OTP" && (
                     <form onSubmit={handleVerifyOTP} className="space-y-4">
                     <div className="space-y-2">
                         <div className="flex justify-between items-center">
                             <Label htmlFor="otp" className="font-bold text-slate-300">Verify OTP</Label>
                             <Button variant="link" className="h-auto p-0 text-xs text-primary hover:text-orange-400" onClick={() => setStep("PASSWORD")} type="button">Back</Button>
                         </div>
                         {maskedEmail && <p className="text-xs text-slate-400">A verification code has been sent to {maskedEmail}</p>}
                         <div className="relative">
                             <Input
                             id="otp"
                             placeholder="0000"
                             value={otp}
                             onChange={(e) => setOtp(e.target.value)}
                             className="text-center font-bold text-xl tracking-[1em] bg-slate-950/40 border-slate-800 focus:border-primary text-slate-100 placeholder:text-slate-700 h-12"
                             required
                             maxLength={4}
                             />
                         </div>
                     </div>
                     {error && <p className="text-sm font-medium text-red-400 bg-red-950/20 p-2 rounded border border-red-900/50">{error}</p>}
                     <Button type="submit" className="w-full h-11 bg-primary hover:bg-orange-600 text-white font-semibold" disabled={loading}>
                         {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                         Verify & Access
                     </Button>
                     </form>
                )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4 text-center border-t border-slate-800/60 pt-4 pb-6">
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Truck className="h-4 w-4" /> SAKTHI AUTO COMPONENTS LIMITED
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
