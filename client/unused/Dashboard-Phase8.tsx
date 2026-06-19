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
  LogOut, ShieldCheck, QrCode, Mic, Plus, Users, History, FileWarning, FormInput, Lock, Eye, EyeOff, Trash2,
  Star, FileText
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
  
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPassword, setVaultPassword] = useState("");
  const [showVaultPassword, setShowVaultPassword] = useState(false);
  const [vaultData, setVaultData] = useState<any[]>([]);

  // Form Builder State
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormDesc, setNewFormDesc] = useState("");
  const [newFormFields, setNewFormFields] = useState<any[]>([{ question: "", type: "text", required: false }]);
  const [formLoading, setFormLoading] = useState(false);

  // Add Admin State
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [addAdminLoading, setAddAdminLoading] = useState(false);

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

  const getToken = () => localStorage.getItem("adminToken");

  const fetchInitialData = async (admin: Admin) => {
    await Promise.all([
      fetchCampaigns(),
      fetchForms(),
      fetchStats(),
      fetchAdmins(),
      fetchUsers(),
      fetchAuditLogs(),
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/feedback/stats");
      if (response.ok) {
        setStats(await response.json());
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

  const handleGenerateFormQr = async (formId: number) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/forms/${formId}/generate-qr`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("QR Code and Link generated successfully!");
        fetchForms();
        fetchCampaigns();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to generate QR code");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate QR code");
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setAuditLogs(await res.json());
    } catch (error) { console.error("Failed to fetch audit logs", error); }
  };

  // Vault Unlock
  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/superadmin/verify-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ password: vaultPassword })
      });
      if (res.ok) {
        setVaultUnlocked(true);
        const vaultRes = await fetch("/api/superadmin/vault", { headers: { Authorization: `Bearer ${getToken()}` } });
        if (vaultRes.ok) setVaultData(await vaultRes.json());
      } else {
        alert("Invalid Password");
      }
    } catch (error) { console.error("Vault unlock failed", error); }
  };

  // User Mgmt
  const handleUserAction = async (userId: number, action: string) => {
    try {
      const endpoint = `/api/users/${userId}/${action}`;
      const res = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) fetchUsers();
    } catch (e) { console.error(`Error handling ${action}`, e); }
  };

  const handlePublishForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle) return alert("Title is required");
    setFormLoading(true);
    try {
      const payload = {
        title: newFormTitle,
        description: newFormDesc,
        fields: newFormFields,
        isGlobalPush: true, // Push to all users
        generateQr: true
      };
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewFormTitle("");
        setNewFormDesc("");
        setNewFormFields([{ question: "", type: "text", required: false }]);
        fetchForms();
        fetchCampaigns(); // Auto-generates a campaign
        alert("Form published successfully");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to publish form");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ username: newAdminUsername, password: newAdminPassword })
      });
      if (res.ok) {
        setNewAdminUsername("");
        setNewAdminPassword("");
        fetchAdmins();
        alert("New Admin created successfully");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create admin");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddAdminLoading(false);
    }
  };

  // Grouping helper for Date-First Hierarchy
  const groupByDate = (items: any[], dateKey: string) => {
    return items.reduce((acc, item) => {
      const d = format(new Date(item[dateKey]), 'yyyy-MM-dd');
      if (!acc[d]) acc[d] = [];
      acc[d].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  };

  if (loading || !stats) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const sentimentData = stats.totalFeedbacks > 0 ? [
    { name: 'Positive', value: stats.sentiment.positive },
    { name: 'Neutral', value: stats.sentiment.neutral },
    { name: 'Negative', value: stats.sentiment.negative },
  ] : []; 

  const groupedFeedbacks = groupByDate(stats.recentFeedbacks, 'createdAt');
  const groupedCampaigns = groupByDate(campaigns, 'createdAt');

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
            <button onClick={() => setActiveTab("Published Forms")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "Published Forms" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><FileText className="w-5 h-5" /> Published Forms</button>
            <button onClick={() => setActiveTab("Campaigns")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "Campaigns" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><QrCode className="w-5 h-5" /> QR Campaigns</button>
            {adminUser?.role === "superadmin" || adminUser?.role === "admin" ? (
              <>
                <button onClick={() => setActiveTab("User Management")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "User Management" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><Users className="w-5 h-5" /> User Management</button>
                <button onClick={() => setActiveTab("Audit Trail")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "Audit Trail" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><History className="w-5 h-5" /> Audit Trail</button>
              </>
            ) : null}
            {adminUser?.role === "superadmin" && (
              <button onClick={() => { setActiveTab("Superadmin Vault"); setVaultUnlocked(false); setVaultPassword(""); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "Superadmin Vault" ? "bg-red-900/40 text-red-100" : "hover:bg-slate-800 text-red-300"}`}><Lock className="w-5 h-5" /> Credentials Vault</button>
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
          <button onClick={() => { localStorage.clear(); navigate("/admin/login"); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"><LogOut className="w-5 h-5" /> Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {activeTab === "Overview" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Date-First Feedback Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              <Card><CardContent className="p-6"><div className="flex justify-between items-start mb-2"><div><p className="text-sm font-medium text-slate-500">Total Feedbacks</p><h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalFeedbacks}</h3></div><div className="p-2 bg-slate-50 rounded-lg"><MessageSquare className="w-6 h-6 text-blue-500" /></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex justify-between items-start mb-2"><div><p className="text-sm font-medium text-slate-500">Appreciation</p><h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.categories.appreciation}</h3></div><div className="p-2 bg-slate-50 rounded-lg"><ThumbsUp className="w-6 h-6 text-green-500" /></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex justify-between items-start mb-2"><div><p className="text-sm font-medium text-slate-500">Suggestions</p><h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.categories.suggestion}</h3></div><div className="p-2 bg-slate-50 rounded-lg"><Lightbulb className="w-6 h-6 text-yellow-500" /></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex justify-between items-start mb-2"><div><p className="text-sm font-medium text-slate-500">Complaints</p><h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.categories.complaint}</h3></div><div className="p-2 bg-slate-50 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-500" /></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex justify-between items-start mb-2"><div><p className="text-sm font-medium text-slate-500">Avg Rating</p><h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.averageRating !== undefined && stats.averageRating !== null && stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} / 5.0` : "N/A"}</h3></div><div className="p-2 bg-slate-50 rounded-lg"><Star className="w-6 h-6 text-amber-500 fill-amber-500" /></div></div></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="lg:col-span-2 shadow-sm border-slate-200">
                <CardHeader><CardTitle>Feedback Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {stats.totalFeedbacks === 0 ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border-b-2 border-slate-200">
                        <FileWarning className="w-8 h-8 mb-2" />
                        <span className="font-medium text-lg text-slate-300">No Data Provided</span>
                        <div className="w-full h-px bg-slate-200 mt-4 relative"><div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-1 bg-slate-200"></div></div></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader><CardTitle>Sentiment</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    {stats.totalFeedbacks === 0 ? (
                      <div className="w-48 h-48 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 font-medium">No Data</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {sentimentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <h3 className="text-xl font-bold">Feedback Timeline</h3>
              {Object.keys(groupedFeedbacks).length === 0 ? (
                <p className="text-slate-500">No feedback available.</p>
              ) : (
                Object.keys(groupedFeedbacks).sort().reverse().map(date => (
                  <div key={date} className="space-y-4">
                    <h4 className="text-lg font-semibold bg-slate-200 p-2 rounded inline-block">{date}</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {groupedFeedbacks[date].map((fb: any, idx: number) => (
                        <div key={idx} className="flex gap-4 p-4 border border-slate-200 rounded-lg bg-white">
                          <div className={`p-2 rounded-full h-fit ${fb.sentiment === 'Positive' ? 'bg-green-100 text-green-600' : fb.sentiment === 'Negative' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                            {fb.audioUrl ? <Mic className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                          </div>
                          <div className="w-full">
                            <div className="flex justify-between">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Campaign: {fb.campaignId || 'None'} | Form: {fb.formId || 'None'}</p>
                            </div>
                            <p className="font-medium text-slate-900 mb-2">"{fb.textContent}"</p>
                            {fb.audioUrl && <audio src={fb.audioUrl} controls className="h-8 w-full max-w-[200px] mb-2" />}
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                              <span>User {fb.userId} • {fb.category}</span>
                              {fb.rating !== undefined && fb.rating !== null && fb.rating > 0 && (
                                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded font-semibold text-xs flex items-center gap-0.5">
                                  Rating: {fb.rating}/5 ★
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "Forms" && (
           <div className="space-y-8 animate-in fade-in duration-500">
             <h1 className="text-2xl font-bold">Form Builder</h1>
             <Card className="border-slate-200">
               <CardHeader>
                 <CardTitle>Create New Manual Form</CardTitle>
                 <CardDescription>Construct a custom feedback form to push to all users.</CardDescription>
               </CardHeader>
               <CardContent>
                 <form onSubmit={handlePublishForm} className="space-y-6">
                   <div className="space-y-4">
                     <div>
                       <label className="text-sm font-medium">Form Title</label>
                       <Input value={newFormTitle} onChange={e => setNewFormTitle(e.target.value)} required placeholder="e.g. Q3 Employee Satisfaction" />
                     </div>
                     <div>
                       <label className="text-sm font-medium">Description</label>
                       <Input value={newFormDesc} onChange={e => setNewFormDesc(e.target.value)} placeholder="Brief context for the form" />
                     </div>
                   </div>

                   <div className="space-y-4 border-t pt-4">
                     <h3 className="font-semibold text-slate-700">Custom Questions</h3>
                     {newFormFields.map((field, idx) => (
                       <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                         <div className="flex-1 space-y-2">
                           <Input 
                             placeholder="Question text" 
                             value={field.question} 
                             onChange={e => {
                               const newFields = [...newFormFields];
                               newFields[idx].question = e.target.value;
                               setNewFormFields(newFields);
                             }} 
                             required 
                           />
                         </div>
                         <div className="w-48">
                           <Select 
                             value={field.type} 
                             onValueChange={v => {
                               const newFields = [...newFormFields];
                               newFields[idx].type = v;
                               setNewFormFields(newFields);
                             }}
                           >
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="text">Text Only</SelectItem>
                               <SelectItem value="audio">Voice Audio Only</SelectItem>
                               <SelectItem value="both">Both (Text + Audio)</SelectItem>
                               <SelectItem value="rating">Rating (1 to 5)</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         <Button 
                           type="button" 
                           variant="ghost" 
                           size="icon" 
                           className="text-red-500 hover:text-red-700 hover:bg-red-50"
                           onClick={() => {
                             const newFields = newFormFields.filter((_, i) => i !== idx);
                             setNewFormFields(newFields.length ? newFields : [{ question: "", type: "text", required: false }]);
                           }}
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                     ))}
                     <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => setNewFormFields([...newFormFields, { question: "", type: "text", required: false }])}>
                       <Plus className="w-4 h-4 mr-2" /> Add Question
                     </Button>
                   </div>
                   
                   <Button type="submit" className="w-full h-12" disabled={formLoading}>
                     {formLoading ? "Publishing..." : "Publish & Push to Users"}
                   </Button>
                 </form>
               </CardContent>
             </Card>
            </div>
         )}

        {activeTab === "Published Forms" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Published Forms</h1>
            {forms.length === 0 ? (
              <p className="text-slate-500">No forms published yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {forms.map(f => {
                  const formUrl = `${window.location.origin}/feedback/entry?form=${f.id}`;
                  return (
                    <Card key={f.id} className="shadow-sm border-slate-200">
                      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 gap-2">
                        <div>
                          <CardTitle className="text-xl">{f.title}</CardTitle>
                          <CardDescription className="mt-1">{f.description}</CardDescription>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          Published: {f.publishedAt ? format(new Date(f.publishedAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                        </span>
                      </CardHeader>
                      <CardContent className="pt-4 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Questions:</h4>
                          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            {f.fields.map((field: any, idx: number) => (
                              <li key={idx}>
                                {field.question} <span className="text-xs font-semibold text-slate-400">({field.type})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 w-full md:w-auto">
                          {f.qrCodeUrl ? (
                            <>
                              <img src={f.qrCodeUrl} alt="Form QR Code" className="w-24 h-24 border rounded-lg bg-white p-1" />
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-500">Clickable / Shareable Link:</p>
                                <a href={formUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all font-medium block">
                                  {formUrl}
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-2 p-2">
                              <p className="text-sm text-slate-500">No QR code generated yet.</p>
                              <Button size="sm" onClick={() => handleGenerateFormQr(f.id)}>
                                Generate QR & Link
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "Campaigns" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Date-First Campaigns Timeline</h1>
            {Object.keys(groupedCampaigns).length === 0 ? (
              <p className="text-slate-500">No campaigns available.</p>
            ) : (
              Object.keys(groupedCampaigns).sort().reverse().map(date => (
                <div key={date} className="space-y-4">
                  <h4 className="text-lg font-semibold bg-slate-200 p-2 rounded inline-block">{date}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {groupedCampaigns[date].map((c: any) => (
                      <Card key={c.id}>
                        <CardHeader><CardTitle className="text-lg">{c.campaignName}</CardTitle></CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                          <img src={c.qrCodeUrl} alt="QR Code" className="w-32 h-32 border rounded-lg p-2 bg-white" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "User Management" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <table className="w-full text-sm text-left border">
                  <thead className="bg-slate-50">
                    <tr><th className="px-6 py-3">Username</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b">
                        <td className="px-6 py-4">{u.username}</td>
                        <td className="px-6 py-4">
                          <span className={u.status === 'Password Reset Pending' ? 'text-amber-600 font-medium' : ''}>{u.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          {u.status === 'Deletion Pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="destructive" onClick={() => handleUserAction(u.id, "approve-deletion")}>Approve Deletion</Button>
                              <Button size="sm" variant="outline" onClick={() => handleUserAction(u.id, "reject-deletion")}>Reject Deletion</Button>
                            </div>
                          )}
                          {u.status === 'Password Reset Pending' && (
                            <Button size="sm" variant="default" onClick={() => handleUserAction(u.id, "approve-reset")}>Approve Reset</Button>
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

        {activeTab === "Superadmin Vault" && adminUser?.role === "superadmin" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-full"><Lock className="w-6 h-6" /></div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Credentials Vault</h1>
            </div>

            {!vaultUnlocked ? (
              <Card className="max-w-md mx-auto mt-12 border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2"><Lock className="w-5 h-5"/> Vault Locked</CardTitle>
                  <CardDescription>Re-authentication is required to access sensitive user credentials.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUnlockVault} className="space-y-4">
                    <div className="relative">
                      <Input 
                        type={showVaultPassword ? "text" : "password"} 
                        placeholder="Enter Super Admin Password" 
                        value={vaultPassword} 
                        onChange={e => setVaultPassword(e.target.value)} 
                        required 
                        className="pr-10 border-red-300 focus-visible:ring-red-500"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowVaultPassword(!showVaultPassword)} 
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showVaultPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button type="submit" variant="destructive" className="w-full">Unlock Vault</Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-red-200 bg-red-50/20">
                <CardHeader>
                  <CardTitle className="text-red-800">Highly Restricted View</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm text-left border border-red-200 bg-white mb-8">
                    <thead className="bg-red-50 text-red-900">
                      <tr><th className="px-6 py-3">ID</th><th className="px-6 py-3">Username</th><th className="px-6 py-3">Plaintext Password</th></tr>
                    </thead>
                    <tbody>
                      {vaultData.map(v => (
                        <tr key={v.id} className="border-b border-red-100">
                          <td className="px-6 py-4">{v.id}</td>
                          <td className="px-6 py-4 font-medium">{v.username}</td>
                          <td className="px-6 py-4 font-mono bg-red-50 text-red-700">{v.plainPassword || "N/A (Hashed)"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <Card className="border-red-200 shadow-sm mt-4">
                    <CardHeader className="bg-red-50 border-b border-red-100">
                      <CardTitle className="text-red-800 text-lg">Add New Administrator</CardTitle>
                      <CardDescription className="text-red-600">Create a new admin account with standard privileges.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <form onSubmit={handleAddAdmin} className="space-y-4 max-w-sm">
                        <Input placeholder="New Admin Username" value={newAdminUsername} onChange={e => setNewAdminUsername(e.target.value)} required />
                        <Input type="password" placeholder="New Admin Password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} required />
                        <Button type="submit" variant="destructive" disabled={addAdminLoading}>
                          {addAdminLoading ? "Creating..." : "Create Admin Account"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "Audit Trail" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Trail & Feedback History</h1>
            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                {auditLogs.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No audit history found.</p>
                ) : (
                  <div className="space-y-6">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative">
                        <div className="absolute top-4 right-4 text-xs text-slate-400">
                          {format(new Date(log.modifiedAt), "MMM d, yyyy h:mm a")}
                        </div>
                        <h4 className="font-semibold text-slate-700 mb-2">Original Feedback ID: {log.originalFeedbackId}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-red-50 border border-red-100 rounded text-sm text-red-900 line-through opacity-80">
                            <strong>Previous Text:</strong><br />
                            "{log.previousText}"
                            {log.previousAudioUrl && <div className="mt-2 text-xs text-red-600">[Audio Attached]</div>}
                          </div>
                          <div className="p-3 bg-green-50 border border-green-100 rounded text-sm text-green-900">
                            <strong>Status/Action:</strong><br />
                            {log.reviewStatus}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
