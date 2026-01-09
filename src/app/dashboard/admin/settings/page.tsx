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
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Automatic Email Service (EmailJS)</h4>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Required for Real Emails</span>
                    </div>
                    
                    <div className="text-sm text-slate-600 bg-white p-3 rounded border">
                        <p className="font-medium mb-1">How to get these keys?</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>Sign up for free at <a href="https://www.emailjs.com/" target="_blank" className="text-blue-600 hover:underline">emailjs.com</a>.</li>
                            <li><b>Service ID:</b> Found in 'Email Services' tab.</li>
                            <li><b>Template ID:</b> Found in 'Email Templates' tab.</li>
                            <li><b>Public Key:</b> Found in 'Account' (profile icon) {'>'} 'General'.</li>
                        </ol>
                        <p className="mt-2 text-xs text-muted-foreground italic">Leave empty to use <b>Simulation Mode</b> (Emails won't actually send, but app will pretend they did).</p>
                    </div>
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

                    {/* Test Connection Section */}
                    <div className="pt-4 border-t mt-4">
                        <Label>Test Connection</Label>
                        <div className="flex gap-2 mt-2">
                            <Input 
                                placeholder="Enter your email to test..." 
                                id="test-email"
                            />
                            <Button variant="secondary" onClick={async () => {
                                const testEmail = (document.getElementById('test-email') as HTMLInputElement).value;
                                if(!testEmail) { alert("Please enter an email address."); return; }
                                if(!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
                                    alert("Please enter Service ID, Template ID and Public Key first."); return;
                                }

                                try {
                                    const emailjs = (await import('@emailjs/browser')).default;
                                    alert("Sending Test Email...");
                                    const res = await emailjs.send(
                                        emailConfig.serviceId,
                                        emailConfig.templateId,
                                        {
                                            to_name: "Admin (Test)",
                                            to_email: testEmail,
                                            subject: "Test Email from Supplier Portal",
                                            message: "If you are reading this, your EmailJS configuration is CORRECT! \n\nVariables Check:\n- to_name: OK\n- to_email: OK\n- subject: OK\n- message: OK"
                                        },
                                        emailConfig.publicKey
                                    );
                                    if(res.status === 200) alert(`Success! Email sent to ${testEmail}. \n\nIf you don't see it, check SPAM folder.`);
                                } catch (e: any) {
                                    alert(`Connection Failed: ${e.text || e.message || "Unknown Error"}. \n\nDouble check your keys.`);
                                }
                            }}>
                                Send Test Email
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Click this to verify your keys work before saving.
                        </p>
                    </div>

                    {/* Email Debug Logs */}
                    <div className="pt-4 border-t mt-4">
                        <Label>Recent Email Activity (Debug Log)</Label>
                        <div className="bg-black text-green-400 p-3 rounded-md mt-2 text-xs font-mono h-32 overflow-y-auto whitespace-pre-wrap">
                            {(() => {
                                if (typeof window === 'undefined') return "Loading logs...";
                                try {
                                    const logs = JSON.parse(localStorage.getItem('email_logs') || '[]');
                                    if (logs.length === 0) return "No email attempts recorded yet.";
                                    return logs.map((log: any, i: number) => 
                                        `[${log.time}] ${log.status}\nTo: ${log.to}\nSub: ${log.subject}\n-------------------`
                                    ).join('\n');
                                } catch (e) { return "Error reading logs."; }
                            })()}
                        </div>
                         <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => {
                            localStorage.removeItem('email_logs');
                            window.location.reload();
                        }}>Clear Logs</Button>
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
