import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Send, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function FeedbackSubmit() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    const user = sessionStorage.getItem("feedbackUser");
    if (!user) {
      navigate("/");
    }
  }, [navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required for voice feedback.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      // Stop all tracks to release mic
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmit = async () => {
    if (!text && !audioUrl) {
      alert("Please provide either text or voice feedback.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulating moving to analyzing state
    setTimeout(() => {
      // In a real scenario, we would upload the audioBlob to a server and get a URL back, 
      // or send it as base64. Here we are passing the text to the next screen for backend processing.
      sessionStorage.setItem("feedbackData", JSON.stringify({
        textContent: text || "[Voice Feedback Provided]",
        audioUrl: audioUrl || undefined
      }));
      navigate("/feedback/results");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">How was your experience?</CardTitle>
            <CardDescription>Share your feedback with us</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Type Feedback
              </label>
              <Textarea
                placeholder="Write your feedback here..."
                className="min-h-[120px] resize-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center justify-center gap-2">
                Voice Feedback
              </label>
              
              <div className="flex flex-col items-center gap-4">
                {isRecording ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Button 
                      variant="destructive" 
                      size="lg" 
                      className="rounded-full w-20 h-20 shadow-lg"
                      onClick={stopRecording}
                    >
                      <Square className="w-8 h-8 fill-current" />
                    </Button>
                  </motion.div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="rounded-full w-20 h-20 shadow-sm border-2 border-primary/20 hover:border-primary/50"
                    onClick={startRecording}
                  >
                    <Mic className="w-8 h-8 text-primary" />
                  </Button>
                )}
                
                {isRecording && <span className="text-destructive font-medium animate-pulse">Recording... Tap to stop</span>}
                {!isRecording && audioUrl && (
                  <div className="w-full space-y-4 text-center">
                    <span className="text-green-600 font-medium">Audio recorded!</span>
                    <audio src={audioUrl} controls className="w-full" />
                    <Button 
                      variant="destructive" 
                      onClick={() => setAudioUrl(null)}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Audio
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button 
              className="w-full h-12 text-lg mt-6" 
              onClick={handleSubmit}
              disabled={isSubmitting || (!text && !audioUrl)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit Feedback
                </>
              )}
            </Button>
            
            <p className="text-center text-sm text-slate-500 mt-4">
              Your feedback helps us improve every day.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
