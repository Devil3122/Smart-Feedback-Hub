import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Extract token from URL hash or query params
        const params = new URLSearchParams(location.search || location.hash.replace("#", "?"));
        const token = params.get("token") || params.get("id_token") || params.get("access_token");
        
        if (!token) {
          // If no token in URL, try hitting the backend callback endpoint if the OAuth flow redirected here directly
          const code = params.get("code");
          if (code) {
            const res = await fetch(`/api/users/oauth/callback?code=${code}`, {
              method: "GET"
            });
            if (res.ok) {
              const data = await res.json();
              localStorage.setItem("userToken", data.token);
              localStorage.setItem("user", JSON.stringify(data.user));
              navigate("/user-dashboard");
              return;
            } else {
              throw new Error("Failed to exchange code");
            }
          }
          throw new Error("No authentication token found");
        }

        // We have a token directly from the URL. Let the backend verify and map the user
        const res = await fetch("/api/users/oauth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });

        if (res.ok) {
          const data = await res.json();
          // Store token and redirect
          localStorage.setItem("userToken", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/user-dashboard");
        } else {
          throw new Error("OAuth mapping failed");
        }
      } catch (err) {
        console.error("OAuth error:", err);
        navigate("/user-auth");
      }
    };

    handleOAuthCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Completing authentication...
        </h2>
        <p className="text-slate-500">Please wait while we verify your credentials.</p>
      </div>
    </div>
  );
}
