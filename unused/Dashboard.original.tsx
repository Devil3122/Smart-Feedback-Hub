import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { MessageSquare, ThumbsUp, Lightbulb, AlertTriangle, Zap, LayoutDashboard, Settings, LogOut, FileText, BarChart3, Mic } from "lucide-react";
import { DashboardStats } from "../../shared/api";
import { format } from "date-fns";

const COLORS = ['#22c55e', '#64748b', '#ef4444']; // Positive, Neutral, Negative

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/feedback/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    // In a real app, we might poll this every minute or use WebSockets
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sentimentData = [
    { name: 'Positive', value: stats.sentiment.positive },
    { name: 'Neutral', value: stats.sentiment.neutral },
    { name: 'Negative', value: stats.sentiment.negative },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white font-bold text-xl mb-8">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            AI Feedback Dashboard
          </div>
          
          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-primary/20 text-white rounded-lg">
              <LayoutDashboard className="w-5 h-5" />
              Overview
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
              <MessageSquare className="w-5 h-5" />
              Feedbacks
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
              <BarChart3 className="w-5 h-5" />
              Analytics
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
              <FileText className="w-5 h-5" />
              Reports
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
              <Mic className="w-5 h-5" />
              Voice Messages
            </a>
          </nav>
        </div>
        
        <div className="mt-auto p-6 space-y-2 border-t border-slate-800">
          <a href="#" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
            <LogOut className="w-5 h-5" />
            Logout
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Total Feedbacks" 
            value={stats.totalFeedbacks} 
            icon={<MessageSquare className="w-6 h-6 text-blue-500" />} 
            trend="+18% this week" 
          />
          <MetricCard 
            title="Appreciation" 
            value={stats.categories.appreciation} 
            icon={<ThumbsUp className="w-6 h-6 text-green-500" />} 
            trend={`${Math.round((stats.categories.appreciation / (stats.totalFeedbacks || 1)) * 100)}%`} 
          />
          <MetricCard 
            title="Suggestions" 
            value={stats.categories.suggestion} 
            icon={<Lightbulb className="w-6 h-6 text-yellow-500" />} 
            trend={`${Math.round((stats.categories.suggestion / (stats.totalFeedbacks || 1)) * 100)}%`} 
          />
          <MetricCard 
            title="Complaints" 
            value={stats.categories.complaint} 
            icon={<AlertTriangle className="w-6 h-6 text-red-500" />} 
            trend={`${Math.round((stats.categories.complaint / (stats.totalFeedbacks || 1)) * 100)}%`} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Feedback Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Top Feedback Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TopicBar name="Service Quality" percentage={35} />
                <TopicBar name="Waiting Time" percentage={25} />
                <TopicBar name="Staff Behavior" percentage={20} />
                <TopicBar name="Cleanliness" percentage={10} />
                <TopicBar name="Others" percentage={10} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Feedbacks</CardTitle>
              <a href="#" className="text-sm text-primary font-medium">View All</a>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentFeedbacks.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No recent feedbacks.</p>
                ) : (
                  stats.recentFeedbacks.slice(0, 3).map((fb, idx) => (
                    <div key={idx} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className={`p-2 rounded-full h-fit ${
                        fb.sentiment === 'Positive' ? 'bg-green-100 text-green-600' :
                        fb.sentiment === 'Negative' ? 'bg-red-100 text-red-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {fb.audioUrl ? <Mic className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">"{fb.textContent}"</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {format(new Date(fb.createdAt), 'dd MMM yyyy')} • {fb.category}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: { title: string, value: number, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">{value}</h3>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            {icon}
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{trend}</p>
      </CardContent>
    </Card>
  );
}

function TopicBar({ name, percentage }: { name: string, percentage: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-32 text-sm text-slate-600 dark:text-slate-400 truncate">{name}</span>
      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="w-12 text-right text-sm font-medium text-slate-700 dark:text-slate-300">{percentage}%</span>
    </div>
  );
}
