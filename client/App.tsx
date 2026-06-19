import "./global.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import FeedbackEntry from "./pages/FeedbackEntry";
import FeedbackSubmit from "./pages/FeedbackSubmit";
import FeedbackResults from "./pages/FeedbackResults";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import UserAuth from "./pages/UserAuth";
import UserDashboard from "./pages/UserDashboard";
import OAuthCallback from "./pages/OAuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Default page for normal user when they access the web */}
          <Route path="/" element={<Navigate to="/user-auth" replace />} />
          <Route path="/user-auth" element={<UserAuth />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          
          {/* Feedback Flow */}
          <Route path="/feedback/entry" element={<FeedbackEntry />} />
          <Route path="/feedback/submit" element={<FeedbackSubmit />} />
          <Route path="/feedback/results" element={<FeedbackResults />} />
          
          {/* Admin Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
      <SpeedInsights />
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
