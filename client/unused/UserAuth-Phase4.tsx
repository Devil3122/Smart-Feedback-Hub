import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function UserAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skipVerification, setSkipVerification] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLogin || !username) {
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
  }, [username, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && usernameAvailable === false) {
      setError("Username is not available.");
      return;
    }
    
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/users/login" : "/api/users/register";
    const payload = isLogin ? { username, password } : { username, email, password, skipVerification };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Authentication failed");
      }

      const data = await response.json();
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/user-dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">User Portal</h1>
          <p className="text-slate-500">Log in to view and manage your feedback.</p>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>{isLogin ? "Sign In" : "Register"}</CardTitle>
            <CardDescription>{isLogin ? "Enter your credentials" : "Create a new account"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <div className="relative">
                  <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  {!isLogin && username && (
                    <div className="absolute right-3 top-3">
                      {usernameAvailable === true && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {usernameAvailable === false && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  )}
                </div>
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              
              {!isLogin && (
                <div className="flex items-center space-x-2 mt-4">
                  <input type="checkbox" id="skipVerify" checked={skipVerification} onChange={(e) => setSkipVerification(e.target.checked)} className="rounded border-gray-300" />
                  <label htmlFor="skipVerify" className="text-sm font-medium">Verify Email Later (Account will be Unverified)</label>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
              
              <Button type="submit" className="w-full h-12 mt-4" disabled={loading || (!isLogin && usernameAvailable === false)}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isLogin ? "Sign In" : "Register")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:underline">
                {isLogin ? "Need an account? Register here." : "Already have an account? Sign in."}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
