import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function UserAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [skipVerification, setSkipVerification] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Clear states when mode changes
  useEffect(() => {
    setError("");
    setSuccess("");
    setPassword("");
    setShowPassword(false);
    if (mode === "login") {
      setUsernameAvailable(null);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "register" || !username) {
      setUsernameAvailable(null);
      return;
    }

    const checkName = async () => {
      try {
        const res = await fetch("/api/users/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username })
        });
        if (res.ok) {
          const data = await res.json();
          setUsernameAvailable(data.available);
        }
      } catch (e) {
        setUsernameAvailable(null);
      }
    };

    const timer = setTimeout(checkName, 500);
    return () => clearTimeout(timer);
  }, [username, mode]);

  const handleLogin = async () => {
    // Attempt user login first
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/user-dashboard");
      return;
    }

    // If user login fails (e.g. 401), attempt admin login transparently
    const adminResponse = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (adminResponse.ok) {
      const data = await adminResponse.json();
      if (data.admin && (data.admin.role === "superadmin" || data.admin.role === "admin")) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(data.admin));
        navigate("/dashboard");
        return;
      }
    }

    // Both failed
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Authentication failed");
  };

  const handleRegister = async () => {
    if (usernameAvailable === false) {
      throw new Error("Username is not available.");
    }

    const response = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, skipVerification }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    localStorage.setItem("userToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    navigate("/user-dashboard");
  };

  const handleForgot = async () => {
    const res = await fetch("/api/users/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to request reset");
    setSuccess(data.message);
    setTimeout(() => setMode("login"), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "login") {
        await handleLogin();
      } else if (mode === "register") {
        await handleRegister();
      } else if (mode === "forgot") {
        await handleForgot();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <Button 
        variant="outline" 
        className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        onClick={() => navigate("/admin/login")}
      >
        Admin Login
      </Button>

      <main className="auth-main-content w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">User Portal</h1>
            <p className="text-slate-500">Powered by our Advanced multi-model architecture.</p>
          </div>

          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none tracking-tight">
                {mode === "login" && "Sign In"}
                {mode === "register" && "Register"}
                {mode === "forgot" && "Forgot Password"}
              </h2>
              <CardDescription>
                {mode === "login" && "Enter your credentials"}
                {mode === "register" && "Create a new account"}
                {mode === "forgot" && "Request a password reset from the admin"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success && <div className="p-3 mb-4 bg-green-50 text-green-700 rounded-md text-sm">{success}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">Username</label>
                  <div className="relative">
                    <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    {mode === "register" && username && (
                      <div className="absolute right-3 top-3">
                        {usernameAvailable === true && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {usernameAvailable === false && <XCircle className="w-4 h-4 text-red-600" />}
                      </div>
                    )}
                  </div>
                </div>

                {mode === "register" && (
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                )}

                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-medium">Password</label>
                      {mode === "login" && (
                        <button type="button" onClick={() => setMode("forgot")} className="text-xs text-blue-600 hover:underline">
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input 
                        id="password"
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="pr-12"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-1 top-1 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                
                {mode === "register" && (
                  <div className="flex items-center space-x-2 mt-4">
                    <input type="checkbox" id="skipVerify" checked={skipVerification} onChange={(e) => setSkipVerification(e.target.checked)} className="rounded border-gray-300" />
                    <label htmlFor="skipVerify" className="text-sm font-medium">Verify Email Later (Account will be Unverified)</label>
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}
                
                <Button type="submit" className="w-full h-12 mt-4" disabled={loading || (mode === "register" && usernameAvailable === false)}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                    mode === "login" ? "Sign In" : 
                    mode === "register" ? "Register" : "Request Reset"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center space-y-2">
                {mode === "login" ? (
                  <button type="button" onClick={() => setMode("register")} className="text-sm text-blue-600 hover:underline block w-full">
                    Need an account? Register here.
                  </button>
                ) : (
                  <button type="button" onClick={() => setMode("login")} className="text-sm text-blue-600 hover:underline block w-full">
                    Back to Sign In
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
