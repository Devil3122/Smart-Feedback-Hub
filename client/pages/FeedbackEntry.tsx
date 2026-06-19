import React from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  contact: z.string().min(5, "Please enter a valid contact number or email"),
  studentId: z.string().optional(),
});

export default function FeedbackEntry() {
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      contact: "",
      studentId: "",
    },
  });

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const campaignParam = searchParams.get("campaign");
  const campaignId = campaignParam ? parseInt(campaignParam, 10) : undefined;
  const formParam = searchParams.get("form");
  const formId = formParam ? parseInt(formParam, 10) : undefined;
  const [alreadySubmitted, setAlreadySubmitted] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/user-auth");
      return;
    }

    const userStr = localStorage.getItem("user");
    if (userStr && formId) {
      const userObj = JSON.parse(userStr);
      fetch(`/api/feedback/user/${userObj.id}`)
        .then(res => res.json())
        .then(fbs => {
          const hasSubmitted = fbs.some((fb: any) => fb.formId === formId);
          if (hasSubmitted) {
            setAlreadySubmitted(true);
          }
        })
        .catch(err => console.error(err));
    }
  }, [navigate, formId]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const userJson = localStorage.getItem("user");
    let userId = undefined;
    if (userJson) {
      const user = JSON.parse(userJson);
      userId = user.id;
    }
    sessionStorage.setItem("feedbackUser", JSON.stringify({ ...values, campaignId, formId, userId }));
    navigate("/feedback/submit");
  }

  if (alreadySubmitted) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-red-700 dark:text-red-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
              Already Submitted
            </h1>
            <p className="text-slate-500">Powered by our Advanced multi-model architecture.</p>
          </div>
          <Card className="shadow-lg border-red-250 dark:border-red-900 bg-red-50/50">
            <CardHeader>
              <h2 className="text-red-700 text-2xl font-bold tracking-tight leading-none">Single Submission Limit</h2>
              <CardDescription>A user account can only fill out and submit a specific Published Form once.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-slate-600 text-center">
                You have already submitted feedback for this form.
              </p>
              <Button className="w-full" onClick={() => navigate("/user-dashboard")}>
                Go to Dashboard to Edit Submission
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            Smart Feedback System
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Powered by our Advanced multi-model architecture.
          </p>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <h2 className="text-xl font-semibold leading-none tracking-tight">Welcome!</h2>
            <CardDescription>Please enter your details to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email / Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer / Student ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ID-12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-lg">
                  Continue
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center justify-center text-sm text-slate-500 gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>We value your privacy</span>
        </div>
      </motion.div>
    </main>
  );
}
