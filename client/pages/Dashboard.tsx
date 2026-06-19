import React, { useEffect, useState } from "react";
import useSWR from "swr";
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
  Star, FileText, Loader2
} from "lucide-react";
import { DashboardStats, Campaign, Admin, User, Form } from "../../shared/api";
import { format } from "date-fns";

const COLORS = ['#22c55e', '#64748b', '#ef4444']; 

function parseQA(textContent: string): { question: string; answer: string }[] {
  if (!textContent) return [];
  const segments = textContent.split(/\n\s*\n/);
  const qas: { question: string; answer: string }[] = [];
  for (const segment of segments) {
    const lines = segment.trim().split('\n');
    if (lines.length >= 2) {
      let question = lines[0].startsWith('Q:') ? lines[0].substring(2).trim() : lines[0];
      let answer = lines[1].startsWith('A:') ? lines[1].substring(2).trim() : lines[1];
      if (lines.length > 2) {
        answer += '\n' + lines.slice(2).join('\n');
      }
      qas.push({ question, answer });
    } else if (segment.trim()) {
      qas.push({ question: "Feedback", answer: segment.trim() });
    }
  }
  return qas;
}

function QAAccordion({ textContent }: { textContent: string }) {
  const qas = parseQA(textContent);
  const [openIndexes, setOpenIndexes] = useState<Record<number, boolean>>({});

  if (qas.length === 0) return <span className="text-slate-400">None</span>;

  const toggle = (idx: number) => {
    setOpenIndexes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-2">
      {qas.map((qa, idx) => {
        const isOpen = !!openIndexes[idx];
        return (
          <div key={idx} className="border rounded bg-slate-50 dark:bg-slate-900 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full flex justify-between items-center p-2 text-left font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span>Question {idx + 1} of {qas.length}: {qa.question}</span>
              <span className="text-[10px] text-slate-400">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div className="p-2 border-t bg-white dark:bg-slate-950 font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {qa.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ComparisonErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ComparisonErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm">
            Error loading this comparison
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [adminUser, setAdminUser] = useState<Admin | null>(null);
  const getToken = () => localStorage.getItem("adminToken");

  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const fetcherWithAuth = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } }).then(res => res.json());

  const { data: stats, mutate: fetchStats, isLoading: loading } = useSWR<DashboardStats>("/api/feedback/stats", fetcher, { refreshInterval: 5000 });
  const { data: campaigns = [], mutate: fetchCampaigns } = useSWR<Campaign[]>("/api/campaigns", fetcherWithAuth, { refreshInterval: 5000 });
  const { data: forms = [], mutate: fetchForms } = useSWR<Form[]>("/api/forms", fetcher, { refreshInterval: 5000 });
  const { data: admins = [], mutate: fetchAdmins } = useSWR<Admin[]>("/api/auth/admins", fetcherWithAuth, { refreshInterval: 5000 });
  const { data: users = [], mutate: fetchUsers } = useSWR<User[]>("/api/users", fetcherWithAuth, { refreshInterval: 5000 });
  const { data: auditLogs = [], mutate: fetchAuditLogs } = useSWR<any[]>("/api/audit", fetcherWithAuth, { refreshInterval: 5000 });

  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPassword, setVaultPassword] = useState("");
  const [showVaultPassword, setShowVaultPassword] = useState(false);
  const [vaultData, setVaultData] = useState<any[]>([]);
  const [expandedFormId, setExpandedFormId] = useState<number | null>(null);
  const [selectedUserFeedback, setSelectedUserFeedback] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState("");

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
  }, [navigate]);

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

  const handleAuditAction = async (historyId: number, action: "Approve" | "Reject" | "Save Both") => {
    try {
      const res = await fetch("/api/feedback/override", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ historyId, action })
      });
      if (res.ok) {
        alert(`Action "${action}" processed successfully`);
        await Promise.all([
          fetchAuditLogs(),
          fetchStats(),
          fetchForms()
        ]);
      } else {
        const err = await res.json();
        alert(err.error || `Failed to perform action: ${action}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to perform action: ${action}`);
    }
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

  const groupedFeedbacks = groupByDate(stats.recentFeedbacks.slice(0, 10), 'createdAt');
  const groupedCampaigns = groupByDate(campaigns, 'createdAt');
  const groupedForms = groupByDate(forms, 'publishedAt');

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
            {(adminUser?.role === "superadmin" || adminUser?.role === "admin") && (
              <button onClick={() => setActiveTab("User Management")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "User Management" ? "bg-primary/20 text-white" : "hover:bg-slate-800"}`}><Users className="w-5 h-5" /> User Management</button>
            )}
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
              <Card><CardContent className="p-6"><div className="flex justify-between items-start mb-2"><div><p className="text-sm font-medium text-slate-500">Complaints</p><h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.categories.complaint}</h3></div><div className="p-2 bg-slate-50 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600" /></div></div></CardContent></Card>
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
                           className="text-red-600 hover:text-red-800 hover:bg-red-50"
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
            {Object.keys(groupedForms).length === 0 ? (
              <p className="text-slate-500">No forms published yet.</p>
            ) : (
              <div className="space-y-8">
                {Object.keys(groupedForms).sort().reverse().map(date => (
                  <div key={date} className="space-y-4">
                    <h3 className="text-lg font-semibold bg-slate-200 dark:bg-slate-800 p-2 rounded inline-block text-slate-850 dark:text-slate-150">{date}</h3>
                    <div className="grid grid-cols-1 gap-6">
                      {groupedForms[date].map(f => {
                  const formUrl = `${window.location.origin}/feedback/entry?form=${f.id}`;
                  const isExpanded = expandedFormId === f.id;
                  return (
                    <Card key={f.id} className="shadow-sm border-slate-200">
                      <CardHeader 
                        onClick={() => setExpandedFormId(isExpanded ? null : f.id)}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 gap-2 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      >
                        <div>
                          <CardTitle className="text-xl">{f.title}</CardTitle>
                          <CardDescription className="mt-1">{f.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400 font-mono">
                            Published: {f.publishedAt ? format(new Date(f.publishedAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">{isExpanded ? "Collapse ▲" : "Expand ▼"}</span>
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent className="pt-4 border-t space-y-6">
                          {f.fields?.some((field: any) => field.type === "rating") && (
                            <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-lg">
                              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400">
                                <Star className="w-6 h-6 fill-current" />
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">Final Rating</h4>
                                <p className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono">
                                  {f.averageRating !== null && f.averageRating !== undefined 
                                    ? `${f.averageRating.toFixed(1)} / 5.0`
                                    : "No ratings yet"}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handleGenerateFormQr(f.id); }}>
                                    Generate QR & Link
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {(() => {
                            if (auditLogsLoading) {
                              return (
                                <div className="space-y-4 border-t pt-4 animate-pulse">
                                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                                    Loading comparison data...
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                                  </div>
                                </div>
                              );
                            }

                            const pendingEdits = (auditLogs || []).filter(
                              (log: any) => log?.formId === f.id && log?.reviewStatus === "Pending Approval"
                            );
                            if (pendingEdits.length === 0) return null;
                            return (
                              <div className="space-y-4 border-t pt-4">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                  <History className="w-5 h-5 text-amber-500 animate-pulse" />
                                  Pending Feedback Edits ({pendingEdits.length})
                                </h4>
                                <div className="space-y-6">
                                  {pendingEdits.map((log: any) => (
                                    <ComparisonErrorBoundary key={log?.id || Math.random()}>
                                      <div className="border border-slate-200 dark:border-slate-850 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/40 relative space-y-4 shadow-sm animate-in fade-in duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                                            <div className="font-bold text-xs uppercase text-slate-500 mb-2">Old Feedback</div>
                                            {log?.previousText ? (
                                              <QAAccordion textContent={log.previousText} />
                                            ) : (
                                              <span className="text-slate-400 italic">No Original Data</span>
                                            )}
                                            {log?.currentRating !== undefined && log?.currentRating !== null ? (
                                              <div className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                                Rating: {log.currentRating} / 5 ★
                                              </div>
                                            ) : (
                                              <div className="mt-2 text-xs text-slate-400 italic">No rating</div>
                                            )}
                                            {log?.previousAudioUrl && (
                                              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                [Audio Attached]
                                              </div>
                                            )}
                                          </div>

                                          <div className="p-3 bg-green-50/30 dark:bg-green-950/10 border border-green-150 dark:border-green-900/50 rounded-lg text-sm">
                                            <div className="font-bold text-xs uppercase text-green-600 dark:text-green-400 mb-2">New Feedback</div>
                                            {log?.proposedText ? (
                                              <QAAccordion textContent={log.proposedText} />
                                            ) : (
                                              <span className="text-slate-400 italic">No proposed edits</span>
                                            )}
                                            {log?.proposedRating !== undefined && log?.proposedRating !== null ? (
                                              <div className="mt-2 text-xs font-semibold text-green-700 dark:text-green-400 font-mono">
                                                Proposed Rating: {log.proposedRating} / 5 ★
                                              </div>
                                            ) : (
                                              <div className="mt-2 text-xs text-slate-400 italic">No rating proposed</div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-850">
                                          <div className="text-xs text-slate-400 font-mono">
                                            Submitted: {log?.modifiedAt ? format(new Date(log.modifiedAt), "MMM d, yyyy h:mm a") : "N/A"}
                                          </div>
                                          <div className="flex gap-2">
                                            <Button 
                                              size="sm" 
                                              className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm transition-colors" 
                                              onClick={() => handleAuditAction(log?.id, "Approve")}
                                            >
                                              Approve
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors" 
                                              onClick={() => handleAuditAction(log?.id, "Save Both")}
                                            >
                                              Save Both
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="destructive" 
                                              className="font-medium shadow-sm transition-colors"
                                              onClick={() => handleAuditAction(log?.id, "Reject")}
                                            >
                                              Reject
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </ComparisonErrorBoundary>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Nested Feedbacks Table */}
                          <div className="space-y-4 border-t pt-4">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200">Collected Feedback ({stats.recentFeedbacks.filter((fb: any) => fb.formId === f.id).length})</h4>
                            {stats.recentFeedbacks.filter((fb: any) => fb.formId === f.id).length === 0 ? (
                              <p className="text-sm text-slate-500">No feedback submitted for this form yet.</p>
                            ) : (
                              <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full text-sm text-left">
                                  <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-700 dark:text-slate-300">
                                    <tr>
                                      <th className="px-4 py-3">User</th>
                                      <th className="px-4 py-3">Rating</th>
                                      <th className="px-4 py-3">Q&A Responses</th>
                                      <th className="px-4 py-3">Sentiment / Category</th>
                                      <th className="px-4 py-3">Audio</th>
                                      <th className="px-4 py-3">Submitted At</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {stats.recentFeedbacks
                                      .filter((fb: any) => fb.formId === f.id)
                                      .map((fb: any) => (
                                        <tr key={fb.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">User {fb.userId}</td>
                                          <td className="px-4 py-3">
                                            {fb.rating ? (
                                              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded font-semibold text-xs">
                                                {fb.rating} / 5 ★
                                              </span>
                                            ) : (
                                              <span className="text-slate-400">-</span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 max-w-xs">
                                            <QAAccordion textContent={fb.textContent} />
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold w-max ${
                                                fb.sentiment === 'Positive' ? 'bg-green-50 text-green-700' :
                                                fb.sentiment === 'Negative' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'
                                              }`}>
                                                {fb.sentiment}
                                              </span>
                                              <span className="text-xs text-slate-500">{fb.category}</span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            {fb.audioUrl ? (
                                              <audio src={fb.audioUrl} controls className="h-8 w-40" />
                                            ) : (
                                              <span className="text-slate-400 text-xs">None</span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-xs text-slate-500">
                                            {format(new Date(fb.createdAt), 'yyyy-MM-dd HH:mm')}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "User Management" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {selectedUserFeedback ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Feedback for {selectedUserFeedback.username}</h1>
                    <p className="text-sm text-slate-500">View, search, and play feedback submitted by this user</p>
                  </div>
                  <Button variant="outline" onClick={() => { setSelectedUserFeedback(null); setFeedbackSearchQuery(""); }}>
                    Back to User List
                  </Button>
                </div>

                <div className="w-full max-w-md">
                  <label htmlFor="feedback-search" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Search Submission Data</label>
                  <Input 
                    id="feedback-search"
                    placeholder="Search by text content, rating, category, sentiment..." 
                    value={feedbackSearchQuery}
                    onChange={(e) => setFeedbackSearchQuery(e.target.value)}
                  />
                </div>

                <Card className="shadow-sm border-slate-200">
                  <CardContent className="pt-6">
                    {(() => {
                      const userFbs = stats.recentFeedbacks.filter((fb: any) => fb.userId === selectedUserFeedback.id);
                      const filteredFbs = userFbs.filter((fb: any) => 
                        fb.textContent.toLowerCase().includes(feedbackSearchQuery.toLowerCase()) ||
                        (fb.category && fb.category.toLowerCase().includes(feedbackSearchQuery.toLowerCase())) ||
                        (fb.sentiment && fb.sentiment.toLowerCase().includes(feedbackSearchQuery.toLowerCase())) ||
                        (fb.rating && fb.rating.toString().includes(feedbackSearchQuery))
                      );

                      if (userFbs.length === 0) {
                        return <p className="text-slate-500 text-center py-8">No feedback submitted by this user yet.</p>;
                      }
                      
                      if (filteredFbs.length === 0) {
                        return <p className="text-slate-500 text-center py-8">No feedback matches your search criteria.</p>;
                      }

                      return (
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-700 dark:text-slate-300">
                              <tr>
                                <th className="px-4 py-3">Form ID / Campaign</th>
                                <th className="px-4 py-3">Rating</th>
                                <th className="px-4 py-3">Q&A Responses</th>
                                <th className="px-4 py-3">Sentiment / Category</th>
                                <th className="px-4 py-3">Audio</th>
                                <th className="px-4 py-3">Submitted At</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {filteredFbs.map((fb: any) => (
                                <tr key={fb.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                    Form: {fb.formId || 'None'} <br />
                                    Campaign: {fb.campaignId || 'None'}
                                  </td>
                                  <td className="px-4 py-3">
                                    {fb.rating ? (
                                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded font-semibold text-xs">
                                        {fb.rating} / 5 ★
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 max-w-xs">
                                    <QAAccordion textContent={fb.textContent} />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold w-max ${
                                        fb.sentiment === 'Positive' ? 'bg-green-50 text-green-700' :
                                        fb.sentiment === 'Negative' ? 'bg-red-50 text-red-750' : 'bg-slate-50 text-slate-700'
                                      }`}>
                                        {fb.sentiment}
                                      </span>
                                      <span className="text-xs text-slate-500">{fb.category}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {fb.audioUrl ? (
                                      <audio src={fb.audioUrl} controls className="h-8 w-40" />
                                    ) : (
                                      <span className="text-slate-400 text-xs">None</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-500">
                                    {format(new Date(fb.createdAt), 'yyyy-MM-dd HH:mm')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                  <div className="w-full max-w-xs">
                    <label htmlFor="user-search" className="sr-only">Search Users</label>
                    <Input 
                      id="user-search"
                      placeholder="Search users by username..." 
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <Card className="shadow-sm border-slate-200">
                  <CardContent className="pt-6">
                    {(() => {
                      const filteredUsers = users.filter((u: any) => 
                        u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
                      );

                      if (filteredUsers.length === 0) {
                        return <p className="text-slate-500 text-center py-8">No users found.</p>;
                      }

                      return (
                        <table className="w-full text-sm text-left border">
                          <thead className="bg-slate-50">
                            <tr><th className="px-6 py-3">Username</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map(u => (
                              <tr key={u.id} className="border-b">
                                <td className="px-6 py-4">{u.username}</td>
                                <td className="px-6 py-4">
                                  <span className={u.status === 'Password Reset Pending' ? 'text-amber-600 font-medium' : ''}>{u.status}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2 items-center">
                                    <Button size="sm" variant="outline" onClick={() => setSelectedUserFeedback(u)}>View Feedback</Button>
                                    {u.status === 'Deletion Pending' && (
                                      <>
                                        <Button size="sm" variant="destructive" onClick={() => handleUserAction(u.id, "approve-deletion")}>Approve Deletion</Button>
                                        <Button size="sm" variant="outline" onClick={() => handleUserAction(u.id, "reject-deletion")}>Reject Deletion</Button>
                                      </>
                                    )}
                                    {u.status === 'Password Reset Pending' && (
                                      <Button size="sm" variant="default" onClick={() => handleUserAction(u.id, "approve-reset")}>Approve Reset</Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </CardContent>
                </Card>
              </>
            )}
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



      </main>
    </div>
  );
}
