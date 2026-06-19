import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Smile, AlertCircle, Lightbulb, Zap, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedbackResponse } from "../../shared/api";

export default function FeedbackResults() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"analyzing" | "results" | "voice-thanks" | "done">("analyzing");
  const [result, setResult] = useState<FeedbackResponse | null>(null);

  useEffect(() => {
    const userJson = sessionStorage.getItem("feedbackUser");
    const dataJson = sessionStorage.getItem("feedbackData");

    if (!userJson || !dataJson) {
      navigate("/");
      return;
    }

    const user = JSON.parse(userJson);
    const data = JSON.parse(dataJson);

    const submitData = async () => {
      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: user.fullName,
            contact: user.contact,
            studentId: user.studentId,
            textContent: data.textContent,
            audioUrl: data.audioUrl,
            campaignId: user.campaignId,
            formId: user.formId,
            userId: user.userId,
            rating: data.rating,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit");
        }

        const resultData: FeedbackResponse = await response.json();
        setResult(resultData);
        setStatus("results");
      } catch (error) {
        console.error(error);
        alert("There was an error processing your feedback.");
        navigate("/");
      }
    };

    submitData();
  }, [navigate]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Appreciation": return <Smile className="w-12 h-12 text-green-500" />;
      case "Suggestion": return <Lightbulb className="w-12 h-12 text-yellow-500" />;
      case "Complaint": return <AlertCircle className="w-12 h-12 text-orange-500" />;
      case "Urgent Issue": return <Zap className="w-12 h-12 text-red-600" />;
      default: return <CheckCircle2 className="w-12 h-12 text-primary" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive": return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "Neutral": return "text-slate-600 bg-slate-50 dark:bg-slate-800/50";
      case "Negative": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      default: return "";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {status === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
              <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-full shadow-2xl flex items-center justify-center relative z-10 border border-slate-100 dark:border-slate-800">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              System is analyzing your feedback...
            </h2>
            <div className="space-y-2 text-slate-500 dark:text-slate-400">
              <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Understanding text</p>
              <p className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-primary" /> Detecting sentiment</p>
              <p className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-primary" /> Categorizing feedback</p>
            </div>
          </motion.div>
        )}

        {status === "results" && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-xl border-slate-200 dark:border-slate-800 text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {getCategoryIcon(result.category)}
                </div>
                <CardTitle className="text-3xl text-slate-900 dark:text-slate-50">
                  {result.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center gap-4">
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getSentimentColor(result.sentiment)}`}>
                    Sentiment: {result.sentiment}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    "Thank you for your kind words! 💜"
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <Button 
                    className="w-full h-12 text-lg"
                    onClick={() => setStatus("voice-thanks")}
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {status === "voice-thanks" && (
           <motion.div
            key="voice-thanks"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md text-center space-y-8"
          >
            <div className="mx-auto w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Mic className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Step 7: Voice Thank You</h2>
              <p className="text-slate-500">
                We are glad you took the time to share your feedback! Would you like to leave a voice appreciation message?
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700 text-white rounded-full"
                onClick={() => setStatus("done")}
              >
                <Mic className="w-5 h-5 mr-2" />
                Use Your Voice to Say Thank You
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  sessionStorage.clear();
                  navigate("/");
                }}
              >
                Skip for now
              </Button>
            </div>
          </motion.div>
        )}

        {status === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center space-y-6"
          >
             <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold">Thank You!</h2>
            <p className="text-slate-500">
              Your voice message has been recorded successfully. We truly appreciate your time and feedback! 💜
            </p>
            <Button 
              className="mt-8"
              onClick={() => {
                sessionStorage.clear();
                navigate("/");
              }}
            >
              Back to Home
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}
