import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserIcon, Trash2, Edit2, AlertTriangle, LogOut, CheckCircle2, QrCode } from "lucide-react";
import { format } from "date-fns";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingFeedback, setEditingFeedback] = useState<any>(null);
  const [editContent, setEditContent] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (!userJson) {
      navigate("/user-auth");
      return;
    }
    const parsedUser = JSON.parse(userJson);
    setUser(parsedUser);
    fetchFeedbacks(parsedUser.id);
    fetchForms();
  }, [navigate]);

  const fetchFeedbacks = async (userId: number) => {
    try {
      const res = await fetch(`/api/feedback/user/${userId}`);
      if (res.ok) setFeedbacks(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchForms = async () => {
    try {
      const res = await fetch("/api/forms");
      if (res.ok) {
        const allForms = await res.json();
        setForms(allForms.filter((f: any) => f.isGlobalPush));
      }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    navigate("/user-auth");
  };

  const handleRequestDeletion = async () => {
    if (!confirm("Are you sure you want to request account deletion?")) return;
    try {
      const res = await fetch("/api/users/request-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ ...user, status: data.status });
        localStorage.setItem("user", JSON.stringify({ ...user, status: data.status }));
        alert("Deletion request submitted.");
      }
    } catch (e) { console.error(e); }
  };

  const handleSendOtp = async () => {
    try {
      const res = await fetch("/api/users/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setOtpSent(true);
        alert(`[SIMULATION] Check your console/email for OTP. Auto-filled for demo: ${data.simulatedOtp}`);
        setOtpInput(data.simulatedOtp);
      }
    } catch (e) { console.error(e); }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await fetch("/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, otp: otpInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        alert("Account verified successfully!");
      } else {
        alert("Invalid OTP");
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteFeedback = async (id: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) fetchFeedbacks(user.id);
    } catch (e) { console.error(e); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedback) return;
    try {
      const res = await fetch(`/api/feedback/${editingFeedback.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, textContent: editContent })
      });
      if (res.ok) {
        setEditingFeedback(null);
        fetchFeedbacks(user.id);
      }
    } catch (e) { console.error(e); }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Welcome, {user.username}
              {user.isVerified ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <AlertTriangle className="w-6 h-6 text-yellow-500" />}
            </h1>
            <p className="text-slate-500">Status: {user.status} | {user.isVerified ? "Verified User" : "Unverified User"}</p>
          </div>
          <div className="flex gap-4">
            {user.status !== "Deletion Pending" && (
              <Button variant="destructive" onClick={handleRequestDeletion}>Request Account Deletion</Button>
            )}
            <Button variant="outline" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
          </div>
        </div>

        {user.status === "Deletion Pending" && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" /> Your account is pending deletion approval from an administrator.
          </div>
        )}

        {!user.isVerified && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-semibold text-blue-900">Verify your email address</h3>
                <p className="text-blue-700 text-sm">Please verify your email to unlock all features.</p>
              </div>
              {!otpSent ? (
                <Button onClick={handleSendOtp}>Send OTP to Email</Button>
              ) : (
                <div className="flex gap-2">
                  <Input placeholder="Enter 6-digit OTP" value={otpInput} onChange={e => setOtpInput(e.target.value)} />
                  <Button onClick={handleVerifyOtp}>Verify</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {forms.length > 0 && (
          <Card className="shadow-sm border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" /> Required Feedback Forms</CardTitle>
              <CardDescription>These forms have been requested by the administration for you to complete.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {forms.map(form => (
                <div key={form.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3">
                  <h4 className="font-semibold">{form.title}</h4>
                  <p className="text-sm text-slate-500">{form.description}</p>
                  <Button onClick={() => navigate(`/feedback/entry?form=${form.id}`)} className="mt-auto">Fill Form</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Your Submitted Feedback</CardTitle>
            <CardDescription>View, edit, or delete your previous feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {feedbacks.length === 0 ? (
              <p className="text-center text-slate-500 py-8">You haven't submitted any feedback yet.</p>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb) => (
                  <div key={fb.id} className="p-4 border border-slate-200 rounded-lg">
                    {editingFeedback?.id === fb.id ? (
                      <form onSubmit={handleEditSubmit} className="space-y-4">
                        <textarea 
                          className="w-full p-3 border rounded-md min-h-[100px]"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button type="submit">Save Changes</Button>
                          <Button variant="outline" type="button" onClick={() => setEditingFeedback(null)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-slate-900">"{fb.textContent}"</p>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingFeedback(fb);
                              setEditContent(fb.textContent);
                            }}>
                              <Edit2 className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteFeedback(fb.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {fb.audioUrl && (
                          <div className="mb-2">
                            <audio src={fb.audioUrl} controls className="h-8 w-full max-w-[200px]" />
                          </div>
                        )}
                        <p className="text-sm text-slate-500">
                          {format(new Date(fb.createdAt), "MMM d, yyyy h:mm a")} • {fb.category}
                          {fb.updatedAt && fb.updatedAt !== fb.createdAt && ` (Edited)`}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
