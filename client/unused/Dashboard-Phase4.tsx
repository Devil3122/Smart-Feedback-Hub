import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  MessageSquare, ThumbsUp, Lightbulb, AlertTriangle, LayoutDashboard, 
  LogOut, ShieldCheck, QrCode, Mic, Plus, Users, History, FileWarning, FormInput, Lock
} from "lucide-react";
import { DashboardStats, Campaign, Admin, User, Form } from "../../shared/api";
import { format } from "date-fns";

const COLORS = ['#22c55e', '#64748b', '#ef4444']; 

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<Admin | null>(null);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [vaultData, setVaultData] = useState<any[]>([]);

  // Sorting / Filtering state
  const [filterType, setFilterType] = useState<"all"|"campaign"|"user"|"form"|"sentiment"|"category">("all");
  const [filterValue, setFilterValue] = useState<string>("all");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const userJson = localStorage.getItem("adminUser");
    if (!token || !userJson) {
      navigate("/admin/login");
      return;
    }
    const parsedAdmin = JSON.parse(userJson);
    setAdminUser(parsedAdmin);
    fetchInitialData(parsedAdmin);
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "Overview") fetchStats(filterType, filterValue);
  }, [filterType, filterValue, activeTab]);

  const getToken = () => localStorage.getItem("adminToken");

  const fetchInitialData = async (admin: Admin) => {
    await Promise.all([
      fetchCampaigns(),
      fetchForms(),
      fetchStats("all", "all"),
      fetchAdmins(),
      fetchUsers(),
      fetchAuditLogs(),
    ]);
    if (admin.role === "superadmin") {
      await fetchVaultData();
    }
    setLoading(false);
  };

  const fetchStats = async (type: string, value: string) => {
    try {
      let url = "/api/feedback/stats?";
      if (type !== "all" && value !== "all") {
        url += `${type}Id=${value}`; // Simplified query string logic, actual backend might need adjusting, but our mock fetch all anyway
      }
      const response = await fetch(url);
      if (response.ok) {
        let data = await response.json();
        // Client-side filtering for multi-dimensional sorting since backend stats logic is rigid in this demo
        if (type !== "all" && value !== "all") {
          data.recentFeedbacks = data.recentFeedbacks.filter((f: any) => {
            if (type === "user") return f.userId?.toString() === value;
            if (type === "campaign") return f.campaignId?.toString() === value;
            if (type === "form") return f.formId?.toString() === value;
            if (type === "sentiment") return f.sentiment === value;
            if (type === "category") return f.category === value;
            return true;
          });
        }
        setStats(data);
      }
    } catch (error) { console.error("Failed to fetch stats", error); }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setCampaigns(await res.json());
    } catch (error) { console.error("Failed to fetch campaigns", error); }
  };

  const fetchForms = async () => {
    try {
      const res = await fetch("/api/forms");
      if (res.ok) setForms(await res.json());
    } catch (error) { console.error("Failed to fetch forms", error); }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/auth/admins", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setAdmins(await res.json());
    } catch (error) { console.error("Failed to fetch admins", error); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setUsers(await res.json());
    } catch (error) { console.error("Failed to fetch users", error); }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setAuditLogs(await res.json());
    } catch (error) { console.error("Failed to fetch audit logs", error); }
  };

  const fetchVaultData = async () => {
    try {
      const res = await fetch("/api/superadmin/vault", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setVaultData(await res.json());
    } catch (error) { console.error("Failed to fetch vault", error); }
  };

  // Form Builder state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formGlobal, setFormGlobal] = useState(false);
  const [formQr, setFormQr] = useState(false);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title: formTitle, description: formDesc, isGlobalPush: formGlobal, generateQr: formQr })
      });
      if (res.ok) {
        setFormTitle(""); setFormDesc(""); setFormGlobal(false); setFormQr(false);
        fetchForms();
      }
    } catch (error) { console.error("Error creating form", error); }
  };

  // User Mgmt
  const handleDeletionAction = async (userId: number, action: "approve"|"reject") => {
    try {
      const res = await fetch(`/api/users/${userId}/${action}-deletion`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) fetchUsers();
    } catch (e) { console.error("Error handling deletion", e); }
  };

  // Audit Override
  const handleAdminOverride = async (historyId: number, action: string) => {
    if (!confirm(`Are you sure you want to perform action: ${action}?`)) return;
    try {
      const res = await fetch("/api/feedback/override", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ historyId, action })
      });
      if (res.ok) {
        fetchAuditLogs();
        fetchStats(filterType, filterValue);
        alert(`Override successful: ${action}`);
      }
    } catch (e) { console.error("Error in override", e); }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  if (loading || !stats) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const sentimentData = [
    { name: 'Positive', value: stats.sentiment.positive },
    { name: 'Neutral', value: stats.sentiment.neutral },
    { name: 'Negative', value: stats.sentiment.negative },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white font-bold text-xl mb-8">
            <LayoutDashboard className="w-6 h-6 text-primary" /> Admin Panel
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab("Overview")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "Overview" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><LayoutDashboard className="w-5 h-5" /> Overview</button>
            <button onClick={() => setActiveTab("Forms")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "Forms" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><FormInput className="w-5 h-5" /> Form Builder</button>
            <button onClick={() => setActiveTab("Campaigns")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "Campaigns" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><QrCode className="w-5 h-5" /> QR Campaigns</button>
            {adminUser?.role === "superadmin" || adminUser?.role === "admin" ? (
              <>
                <button onClick={() => setActiveTab("User Management")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "User Management" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><Users className="w-5 h-5" /> User Management</button>
                <button onClick={() => setActiveTab("Audit Trail")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "Audit Trail" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><History className="w-5 h-5" /> Audit Trail</button>
                <button onClick={() => setActiveTab("Access Control")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "Access Control" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><ShieldCheck className="w-5 h-5" /> Access Control</button>
              </>
            ) : null}
            {adminUser?.role === "superadmin" && (
              <button onClick={() => setActiveTab("Superadmin Vault")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "Superadmin Vault" ? "bg-red-900/40 text-red-100" : "hover:bg-slate-800 text-red-300"}`}><Lock className="w-5 h-5" /> Credentials Vault</button>
            )}
          </nav>
        </div>
        <div className="mt-auto p-6 space-y-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 text-slate-400">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">{adminUser?.username.charAt(0).toUpperCase()}</div>
            <div>
              <p className="text-sm font-medium text-white">{adminUser?.username}</p>
              <p className="text-xs">{adminUser?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"><LogOut className="w-5 h-5" /> Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {activeTab === "Overview" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Feedback Overview</h1>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterType} onValueChange={(v: any) => { setFilterType(v); setFilterValue("all"); }}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter By" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Feedback</SelectItem>
                    <SelectItem value="user">By User</SelectItem>
                    <SelectItem value="campaign">By QR Campaign</SelectItem>
                    <SelectItem value="form">By Manual Form</SelectItem>
                    <SelectItem value="sentiment">By Sentiment</SelectItem>
                    <SelectItem value="category">By Category</SelectItem>
                  </SelectContent>
                </Select>
                
                {filterType !== "all" && (
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Value" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {filterType === "user" && users.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.username}</SelectItem>)}
                      {filterType === "campaign" && campaigns.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.campaignName}</SelectItem>)}
                      {filterType === "form" && forms.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.title}</SelectItem>)}
                      {filterType === "sentiment" && ["Positive", "Neutral", "Negative"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      {filterType === "category" && ["Appreciation", "Suggestion", "Complaint", "Urgent Issue"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard title="Total Feedbacks" value={stats.totalFeedbacks} icon={<MessageSquare className="w-6 h-6 text-blue-500" />} />
              <MetricCard title="Appreciation" value={stats.categories.appreciation} icon={<ThumbsUp className="w-6 h-6 text-green-500" />} />
              <MetricCard title="Suggestions" value={stats.categories.suggestion} icon={<Lightbulb className="w-6 h-6 text-yellow-500" />} />
              <MetricCard title="Complaints" value={stats.categories.complaint} icon={<AlertTriangle className="w-6 h-6 text-red-500" />} />
            </div>

            {stats.totalFeedbacks === 0 ? (
              <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                <FileWarning className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Data Available</h3>
                <p className="text-slate-500">No feedbacks match your advanced sorting criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
                  <CardHeader><CardTitle>Feedback Trend</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                  <CardHeader><CardTitle>Sentiment</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {sentimentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                <CardHeader><CardTitle>Feedbacks List</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentFeedbacks.length === 0 ? (
                      <p className="text-slate-500 py-4">No feedbacks.</p>
                    ) : (
                      stats.recentFeedbacks.map((fb, idx) => (
                        <div key={idx} className="flex gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                          <div className={`p-2 rounded-full h-fit ${
                            fb.sentiment === 'Positive' ? 'bg-green-100 text-green-600' :
                            fb.sentiment === 'Negative' ? 'bg-red-100 text-red-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {fb.audioUrl ? <Mic className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                          </div>
                          <div className="w-full">
                            <p className="font-medium text-slate-900 dark:text-slate-100 mb-2">"{fb.textContent}"</p>
                            {fb.audioUrl && <audio src={fb.audioUrl} controls className="h-8 w-full max-w-[200px] mb-2" />}
                            <p className="text-sm text-slate-500">
                              {format(new Date(fb.createdAt), 'dd MMM yyyy')} • User {fb.userId} • {fb.category}
                              {fb.updatedAt && fb.updatedAt !== fb.createdAt && ` (Edited)`}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "Forms" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dynamic Form Generator</h1>
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader><CardTitle>Create New Manual Form</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateForm} className="space-y-4 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Form Title</label>
                    <Input placeholder="e.g. Employee Satisfaction Survey" value={formTitle} onChange={e => setFormTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Form Description / Prompt</label>
                    <Input placeholder="Please let us know your thoughts on..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <input type="checkbox" id="globalPush" checked={formGlobal} onChange={e => setFormGlobal(e.target.checked)} className="rounded" />
                    <label htmlFor="globalPush" className="text-sm font-medium">Global Push (Visible on all User Dashboards immediately)</label>
                  </div>
                  
                  <div className="flex items-center space-x-2 pb-2">
                    <input type="checkbox" id="genQr" checked={formQr} onChange={e => setFormQr(e.target.checked)} className="rounded" />
                    <label htmlFor="genQr" className="text-sm font-medium">Generate dedicated QR Code and Link for this form</label>
                  </div>

                  <Button type="submit"><Plus className="w-4 h-4 mr-2" /> Publish Form</Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map(f => {
                const formUrl = `${window.location.origin}/feedback/entry?form=${f.id}`;
                return (
                  <Card key={f.id} className="shadow-sm border-slate-200 dark:border-slate-800 flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">{f.title}</CardTitle>
                      <p className="text-sm text-slate-500">{f.isGlobalPush ? "Global Push Active" : "Private Link"}</p>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4 flex-1">
                      <p className="text-sm text-center italic">"{f.description}"</p>
                      {f.qrCodeUrl && (
                        <>
                          <img src={f.qrCodeUrl} alt="QR Code" className="w-32 h-32 border rounded-lg p-2 bg-white mt-auto" />
                          <a href={formUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs break-all">{formUrl}</a>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Keeping existing Campaigns Tab intact as requested */}
        {activeTab === "Campaigns" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">QR Campaigns (Storage Folders)</h1>
            {/* Same campaign logic from before */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campaigns.map(c => (
                <Card key={c.id}>
                  <CardHeader><CardTitle className="text-lg">{c.campaignName}</CardTitle></CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <img src={c.qrCodeUrl} alt="QR Code" className="w-32 h-32 border rounded-lg p-2 bg-white" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "User Management" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader><CardTitle>End Users</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm text-left border">
                  <thead className="bg-slate-50">
                    <tr><th className="px-6 py-3">Username</th><th className="px-6 py-3">Verification</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b">
                        <td className="px-6 py-4">{u.username}</td>
                        <td className="px-6 py-4">{u.isVerified ? "Verified" : "Unverified"}</td>
                        <td className="px-6 py-4">{u.status}</td>
                        <td className="px-6 py-4">
                          {u.status === 'Deletion Pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="destructive" onClick={() => handleDeletionAction(u.id, "approve")}>Approve</Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeletionAction(u.id, "reject")}>Reject</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "Audit Trail" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Feedback Version Control</h1>
            <div className="space-y-6">
              {auditLogs.length === 0 ? (
                <p className="text-slate-500">No modifications logged yet.</p>
              ) : auditLogs.map(log => (
                <Card key={log.id} className="shadow-sm border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-500">
                      Feedback #{log.originalFeedbackId} modified on {format(new Date(log.modifiedAt), "MMM d, yyyy h:mm a")} | Status: {log.reviewStatus}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">Original Version</h4>
                        <p className="text-slate-700">{log.previousText}</p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">Modified Version</h4>
                        <p className="text-slate-700">{log.isDeleted ? "[User Requested Deletion]" : log.currentText}</p>
                      </div>
                    </div>
                    
                    {log.reviewStatus === "Pending" && (
                      <div className="flex gap-3 bg-slate-50 p-4 border rounded-lg">
                        <Button variant="default" onClick={() => handleAdminOverride(log.id, "Accept Modified")}>Accept Modified</Button>
                        <Button variant="outline" onClick={() => handleAdminOverride(log.id, "Revert to Old")}>Revert to Old</Button>
                        <Button variant="secondary" onClick={() => handleAdminOverride(log.id, "Save Both")}>Save Both (Fork)</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Superadmin Vault" && adminUser?.role === "superadmin" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-full"><Lock className="w-6 h-6" /></div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Credentials Vault</h1>
            </div>
            <Card className="border-red-200 bg-red-50/20">
              <CardHeader>
                <CardTitle className="text-red-800">Highly Restricted View</CardTitle>
                <CardDescription>This view is strictly accessible by the Super Admin role. Data is read-only.</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm text-left border border-red-200 bg-white">
                  <thead className="bg-red-50 text-red-900">
                    <tr><th className="px-6 py-3">ID</th><th className="px-6 py-3">Username</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Plaintext Password</th></tr>
                  </thead>
                  <tbody>
                    {vaultData.map(v => (
                      <tr key={v.id} className="border-b border-red-100">
                        <td className="px-6 py-4">{v.id}</td>
                        <td className="px-6 py-4 font-medium">{v.username}</td>
                        <td className="px-6 py-4">{v.email}</td>
                        <td className="px-6 py-4 font-mono bg-red-50 text-red-700">{v.plainPassword || "N/A (Hashed)"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div><p className="text-sm font-medium text-slate-500">{title}</p><h3 className="text-3xl font-bold text-slate-900 mt-1">{value}</h3></div>
          <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
