"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { SYSTEM_SETTINGS, updateSettings } from "@/lib/settings"

import { useLocalStorage } from "@/hooks/use-local-storage"

export default function AdminSettingsPage() {
  const [ppmTargets, setPpmTargets] = useState(SYSTEM_SETTINGS.ppmTargets)
  const [adminEmail, setAdminEmail] = useLocalStorage("admin_email", "admin@company.com")
  
  // EmailJS Config
  const [emailConfig, setEmailConfig] = useLocalStorage("emailjs_config", {
      serviceId: "",
      templateId: "",
      publicKey: ""
  })

  const handleSaveSettings = () => {
      updateSettings({ ppmTargets })
      // Email config is auto-saved by useLocalStorage hooks, but we can simulate a global save
      alert("Settings Updated! Email configuration saved.")
  }
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage system configurations and preferences.
        </p>
      </div>
      <Separator />

      <div className="grid gap-6">
          {/* Email Notifications */}
          <Card>
              <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure how you receive alerts.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="emails" className="flex flex-col space-y-1">
                      <span>Email Alerts</span>
                      <span className="font-normal text-xs text-muted-foreground">
                        Receive daily summaries and critical alerts via email.
                      </span>
                    </Label>
                    <Switch id="emails" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="security" className="flex flex-col space-y-1">
                      <span>Security Alerts</span>
                      <span className="font-normal text-xs text-muted-foreground">
                        Get notified about new supplier registrations.
                      </span>
                    </Label>
                    <Switch id="security" defaultChecked />
                  </div>
              </CardContent>
          </Card>

          {/* Performance Targets */}
          <Card>
              <CardHeader>
                  <CardTitle>Performance Targets</CardTitle>
                  <CardDescription>Set quality targets for different supplier categories.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>PPM Target (Pre-Machining)</Label>
                          <Input 
                            type="number" 
                            value={ppmTargets.preMachining} 
                            onChange={(e) => setPpmTargets({...ppmTargets, preMachining: Number(e.target.value)})}
                          />
                          <p className="text-xs text-muted-foreground">Allowable max PPM.</p>
                      </div>
                      <div className="space-y-2">
                          <Label>PPM Target (Child-Parts)</Label>
                          <Input 
                            type="number" 
                            value={ppmTargets.childPart} 
                            onChange={(e) => setPpmTargets({...ppmTargets, childPart: Number(e.target.value)})}
                          />
                          <p className="text-xs text-muted-foreground">Zero defect expectation.</p>
                      </div>
                  </div>
                  <div className="flex justify-end">
                      <Button onClick={handleSaveSettings}>Save Targets</Button>
                  </div>
              </CardContent>
          </Card>

          {/* System Configuration */}
           <Card>
              <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Global settings for the Supplier Portal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {/* EmailJS Configuration */}
                 <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                    <h4 className="font-semibold text-sm">Automatic Email Service (EmailJS)</h4>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                             <Label>Service ID</Label>
                             <Input 
                                placeholder="service_xxxxxx" 
                                value={emailConfig.serviceId} 
                                onChange={(e) => setEmailConfig({...emailConfig, serviceId: e.target.value})}
                             />
                        </div>
                        <div className="space-y-2">
                             <Label>Template ID</Label>
                             <Input 
                                placeholder="template_xxxxxx" 
                                value={emailConfig.templateId} 
                                onChange={(e) => setEmailConfig({...emailConfig, templateId: e.target.value})}
                             />
                        </div>
                        <div className="space-y-2">
                             <Label>Public Key</Label>
                             <Input 
                                placeholder="User ID / Public Key" 
                                type="password"
                                value={emailConfig.publicKey} 
                                onChange={(e) => setEmailConfig({...emailConfig, publicKey: e.target.value})}
                             />
                        </div>
                    </div>
                 </div>

                  <div className="space-y-2">

                      <Label>Admin Notification Email</Label>
                      <Input 
                          value={adminEmail} 
                          onChange={(e) => setAdminEmail(e.target.value)} 
                          placeholder="e.g. procurement@company.com"
                      />
                      <p className="text-xs text-muted-foreground">This email will show as the sender for supplier credentials.</p>
                  </div>
                  <div className="space-y-2">
                      <Label>Default Currency</Label>
                      <Input value="INR (₹)" disabled readOnly className="max-w-xs bg-muted" />
                  </div>
                   <div className="space-y-2">
                      <Label>System Version</Label>
                      <p className="text-sm text-muted-foreground">v1.2.0 (Build 2024.12.26)</p>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  )
}
