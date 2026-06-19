import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Send, Loader2, Trash2, FileQuestion } from "lucide-react";
import { motion } from "framer-motion";

export default function FeedbackSubmit() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, { text: string; audioUrl: string | null; rating?: number }>>({});
  const [activeRecordingIdx, setActiveRecordingIdx] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    const userStr = sessionStorage.getItem("feedbackUser");
    if (!userStr) {
      navigate("/");
      return;
    }
    const user = JSON.parse(userStr);
    
    if (user.formId) {
      fetch("/api/forms")
        .then(res => res.json())
        .then(forms => {
          const matched = forms.find((f: any) => f.id === user.formId);
          if (matched) {
            setFormData(matched);
            const initialAnswers: any = {};
            matched.fields.forEach((_: any, i: number) => {
              initialAnswers[i] = { text: "", audioUrl: null, rating: undefined };
            });
            setAnswers(initialAnswers);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const startRecording = async (idx: number) => {
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
        setAnswers(prev => ({ ...prev, [idx]: { ...prev[idx], audioUrl: url } }));
      };

      mediaRecorder.current.start();
      setActiveRecordingIdx(idx);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required for voice feedback.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setActiveRecordingIdx(null);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleTextChange = (idx: number, val: string) => {
    setAnswers(prev => ({ ...prev, [idx]: { ...prev[idx], text: val } }));
  };

  const deleteAudio = (idx: number) => {
    setAnswers(prev => ({ ...prev, [idx]: { ...prev[idx], audioUrl: null } }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      let combinedText = "";
      let firstAudioUrl: string | undefined = undefined;
      let firstRating: number | undefined = undefined;

      if (formData && formData.fields) {
        formData.fields.forEach((f: any, i: number) => {
          const ans = answers[i] || { text: "", audioUrl: null, rating: undefined };
          if (f.type === "rating") {
            combinedText += `Q: ${f.question}\nA: ${ans.rating ? `${ans.rating} / 5` : "N/A"}\n\n`;
            if (firstRating === undefined && ans.rating !== undefined) {
              firstRating = ans.rating;
            }
          } else {
            combinedText += `Q: ${f.question}\nA: ${ans.text || (ans.audioUrl ? "[Voice Feedback]" : "N/A")}\n\n`;
            if (!firstAudioUrl && ans.audioUrl) {
              firstAudioUrl = ans.audioUrl;
            }
          }
        });
      } else {
        const ans = answers[0] || { text: "", audioUrl: null, rating: undefined };
        combinedText = ans.text || "[Voice Feedback Provided]";
        firstAudioUrl = ans.audioUrl || undefined;
      }

      sessionStorage.setItem("feedbackData", JSON.stringify({
        textContent: combinedText.trim(),
        audioUrl: firstAudioUrl,
        rating: firstRating
      }));
      navigate("/feedback/results");
    }, 500);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  // Generic fallback if no formId or form not found
  const fieldsToRender = formData?.fields || [{ question: "How was your experience?", type: "both" }];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl"
      >
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="text-center border-b pb-6">
            <h1 className="text-2xl font-bold">{formData ? formData.title : "Submit Feedback"}</h1>
            <CardDescription>{formData ? formData.description : "Share your thoughts with us"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            
            {fieldsToRender.map((field: any, idx: number) => {
              const isRating = field.type === "rating";
              const showText = !isRating && (field.type === "text" || field.type === "both" || !field.type);
              const showAudio = !isRating && (field.type === "audio" || field.type === "both" || !field.type);
              const ans = answers[idx] || { text: "", audioUrl: null, rating: undefined };

              return (
                <div key={idx} className="space-y-4 p-4 border rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                  <h2 className="font-medium text-lg flex items-start gap-2">
                    <FileQuestion className="w-5 h-5 mt-0.5 text-primary" />
                    {field.question}
                  </h2>
                  
                  <div className="pl-7 space-y-4">
                    {isRating && (
                      <div className="flex flex-col items-center gap-4 py-2 w-full">
                        <div className="flex gap-3 justify-center flex-wrap">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                setAnswers(prev => ({
                                  ...prev,
                                  [idx]: { ...prev[idx], rating: val }
                                }));
                              }}
                              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-all ${
                                ans.rating === val
                                  ? "bg-amber-500 border-amber-500 text-white scale-110 shadow-md"
                                  : "border-slate-300 hover:border-slate-400 text-slate-600 dark:text-slate-300 dark:border-slate-700"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                        {ans.rating && (
                          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                            Selected Rating: {ans.rating} / 5
                          </p>
                        )}
                      </div>
                    )}

                    {showText && (
                      <Textarea
                        placeholder="Type your response here..."
                        className="min-h-[100px] resize-y"
                        value={ans.text}
                        onChange={(e) => handleTextChange(idx, e.target.value)}
                      />
                    )}

                    {showText && showAudio && (
                      <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-100"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 uppercase">OR / AND</span>
                        <div className="flex-grow border-t border-slate-100"></div>
                      </div>
                    )}

                    {showAudio && (
                      <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-100">
                        {activeRecordingIdx === idx ? (
                          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                            <Button variant="destructive" size="lg" className="rounded-full w-16 h-16 shadow-md" onClick={stopRecording}>
                              <Square className="w-6 h-6 fill-current" />
                            </Button>
                          </motion.div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="lg" 
                            className="rounded-full w-16 h-16 border-2 border-primary/20 text-primary hover:bg-primary/5"
                            onClick={() => startRecording(idx)}
                            disabled={activeRecordingIdx !== null}
                          >
                            <Mic className="w-6 h-6" />
                          </Button>
                        )}

                        {activeRecordingIdx === idx && <span className="text-destructive text-sm font-medium animate-pulse mt-3">Recording... Tap to stop</span>}
                        
                        {!activeRecordingIdx && ans.audioUrl && (
                          <div className="w-full mt-4 space-y-3">
                            <audio src={ans.audioUrl} controls className="w-full h-10" />
                            <Button variant="ghost" size="sm" onClick={() => deleteAudio(idx)} className="w-full text-red-700 hover:text-red-800 hover:bg-red-50">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Recording
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="pt-4">
              <Button 
                className="w-full h-14 text-lg shadow-md" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  <><Send className="mr-2 h-5 w-5" /> Submit Response</>
                )}
              </Button>
            </div>
            
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
