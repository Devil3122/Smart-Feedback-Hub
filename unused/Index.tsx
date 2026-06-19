import { useState } from "react";
import {
  QrCode,
  MessageSquare,
  Mic,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ThumbsUp,
  BarChart3,
  PieChart,
  TrendingUp,
  Menu,
  X,
  Zap,
  Volume2,
  User,
  Mail,
} from "lucide-react";

export default function Index() {
  const [currentScreen, setCurrentScreen] = useState<
    "qr" | "login" | "feedback" | "input" | "analysis" | "results"
  >("qr");
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState(
    "The customer service team resolved my issue quickly and professionally. Great experience!"
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">
                FeedbackAI System
              </h1>
            </div>
            <nav className="hidden md:flex gap-8">
              <a href="#flow" className="text-sm font-medium text-gray-700">
                Flow
              </a>
              <a href="#categorization" className="text-sm font-medium text-gray-700">
                Categorization
              </a>
              <a href="#dashboard" className="text-sm font-medium text-gray-700">
                Dashboard
              </a>
            </nav>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SCREEN 1: QR CODE */}
        {currentScreen === "qr" && (
          <div id="flow" className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Scan QR Code
            </h2>
            <p className="text-gray-600 mb-8">
              Start your feedback journey by scanning the QR code.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* QR Code Display */}
              <div className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center min-h-96">
                <div className="w-40 h-40 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center mb-6">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  QR Code
                </p>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Point your camera at the QR code to begin
                </p>
                <button
                  onClick={() => setCurrentScreen("login")}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Continue
                </button>
              </div>

              {/* Navigation */}
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentScreen("qr")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-purple-600 text-white"
                >
                  1. Scan QR Code
                </button>
                <button
                  onClick={() => setCurrentScreen("login")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  2. Enter Details
                </button>
                <button
                  onClick={() => setCurrentScreen("feedback")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  3. Choose Method
                </button>
                <button
                  onClick={() => setCurrentScreen("input")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  4. Submit Feedback
                </button>
                <button
                  onClick={() => setCurrentScreen("analysis")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  5. AI Analysis
                </button>
                <button
                  onClick={() => setCurrentScreen("results")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  6. View Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: LOGIN / DETAILS */}
        {currentScreen === "login" && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
            <p className="text-gray-600 mb-8">
              Tell us a bit about yourself.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-8 min-h-96">
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email or Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Customer or Student ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="ABC-12345"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentScreen("feedback")}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                  >
                    Continue
                  </button>
                </form>

                <p className="text-xs text-gray-500 mt-6 text-center">
                  Your information is secure and private.
                </p>
              </div>

              {/* Navigation */}
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentScreen("qr")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  1. Scan QR Code
                </button>
                <button
                  onClick={() => setCurrentScreen("login")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-purple-600 text-white"
                >
                  2. Enter Details
                </button>
                <button
                  onClick={() => setCurrentScreen("feedback")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  3. Choose Method
                </button>
                <button
                  onClick={() => setCurrentScreen("input")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  4. Submit Feedback
                </button>
                <button
                  onClick={() => setCurrentScreen("analysis")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  5. AI Analysis
                </button>
                <button
                  onClick={() => setCurrentScreen("results")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  6. View Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: SUBMIT FEEDBACK OPTIONS */}
        {currentScreen === "feedback" && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Submit Feedback
            </h2>
            <p className="text-gray-600 mb-8">
              Choose how you would like to share your feedback.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Type Feedback Card */}
                <div className="border-2 border-gray-300 rounded-lg p-8 cursor-pointer hover:border-purple-600 hover:bg-gray-50 transition"
                  onClick={() => setCurrentScreen("input")}
                >
                  <MessageSquare className="w-12 h-12 text-purple-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Type Feedback
                  </h3>
                  <p className="text-gray-600">
                    Write your thoughts and experiences.
                  </p>
                </div>

                {/* Voice Feedback Card */}
                <div className="border-2 border-gray-300 rounded-lg p-8 cursor-pointer hover:border-purple-600 hover:bg-gray-50 transition">
                  <Mic className="w-12 h-12 text-purple-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Voice Feedback
                  </h3>
                  <p className="text-gray-600">
                    Speak your feedback naturally.
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentScreen("qr")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  1. Scan QR Code
                </button>
                <button
                  onClick={() => setCurrentScreen("login")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  2. Enter Details
                </button>
                <button
                  onClick={() => setCurrentScreen("feedback")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-purple-600 text-white"
                >
                  3. Choose Method
                </button>
                <button
                  onClick={() => setCurrentScreen("input")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  4. Submit Feedback
                </button>
                <button
                  onClick={() => setCurrentScreen("analysis")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  5. AI Analysis
                </button>
                <button
                  onClick={() => setCurrentScreen("results")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  6. View Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 4: FEEDBACK INPUT */}
        {currentScreen === "input" && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              How was your experience?
            </h2>
            <p className="text-gray-600 mb-8">
              Your honest feedback helps us improve.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-8 min-h-96">
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Your Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-32"
                />
                <button
                  onClick={() => setCurrentScreen("analysis")}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition mt-6"
                >
                  Submit Feedback
                </button>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Thank you for your valuable input!
                </p>
              </div>

              {/* Navigation */}
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentScreen("qr")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  1. Scan QR Code
                </button>
                <button
                  onClick={() => setCurrentScreen("login")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  2. Enter Details
                </button>
                <button
                  onClick={() => setCurrentScreen("feedback")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  3. Choose Method
                </button>
                <button
                  onClick={() => setCurrentScreen("input")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-purple-600 text-white"
                >
                  4. Submit Feedback
                </button>
                <button
                  onClick={() => setCurrentScreen("analysis")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  5. AI Analysis
                </button>
                <button
                  onClick={() => setCurrentScreen("results")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  6. View Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 5: AI ANALYSIS */}
        {currentScreen === "analysis" && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              AI Analysis
            </h2>
            <p className="text-gray-600 mb-8">
              AI is analyzing your feedback.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center min-h-96">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-8 text-center">
                  Processing your feedback...
                </h3>

                <div className="w-full space-y-4">
                  {["Understanding text", "Detecting sentiment", "Categorizing feedback"].map(
                    (step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-600 animate-pulse" />
                        <span className="text-sm font-medium text-gray-700">
                          {step}
                        </span>
                      </div>
                    )
                  )}
                </div>

                <button
                  onClick={() => setCurrentScreen("results")}
                  className="mt-8 bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Skip to Results
                </button>
              </div>

              {/* Navigation */}
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentScreen("qr")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  1. Scan QR Code
                </button>
                <button
                  onClick={() => setCurrentScreen("login")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  2. Enter Details
                </button>
                <button
                  onClick={() => setCurrentScreen("feedback")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  3. Choose Method
                </button>
                <button
                  onClick={() => setCurrentScreen("input")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  4. Submit Feedback
                </button>
                <button
                  onClick={() => setCurrentScreen("analysis")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-purple-600 text-white"
                >
                  5. AI Analysis
                </button>
                <button
                  onClick={() => setCurrentScreen("results")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  6. View Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 6: AI RESULTS */}
        {currentScreen === "results" && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              AI Analysis Result
            </h2>
            <p className="text-gray-600 mb-8">
              Your feedback has been analyzed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Sentiment Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Sentiment Status
                  </p>
                  <p className="text-2xl font-bold text-green-600">Positive</p>
                </div>

                {/* Appreciation Card */}
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-green-900 mb-2">
                        Appreciation
                      </h3>
                      <p className="text-sm text-green-800">
                        Customer expressed satisfaction with service quality.
                      </p>
                      <button className="text-green-700 font-semibold text-sm mt-3 hover:underline">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentScreen("qr")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  1. Scan QR Code
                </button>
                <button
                  onClick={() => setCurrentScreen("login")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  2. Enter Details
                </button>
                <button
                  onClick={() => setCurrentScreen("feedback")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  3. Choose Method
                </button>
                <button
                  onClick={() => setCurrentScreen("input")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  4. Submit Feedback
                </button>
                <button
                  onClick={() => setCurrentScreen("analysis")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-gray-100 text-gray-900 hover:bg-gray-200"
                >
                  5. AI Analysis
                </button>
                <button
                  onClick={() => setCurrentScreen("results")}
                  className="w-full p-4 rounded-lg font-semibold text-left bg-purple-600 text-white"
                >
                  6. View Results
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SECTION: AI CATEGORIZES FEEDBACK */}
      <section id="categorization" className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            AI Categorizes Feedback Into 4 Main Areas
          </h2>
          <p className="text-gray-600 mb-8">
            Automatic categorization for faster action.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Appreciation */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <ThumbsUp className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Appreciation</h3>
              <p className="text-sm text-gray-600 mb-3">
                Positive feedback about experiences or services.
              </p>
              <div className="bg-gray-50 rounded p-3 mb-3 border border-gray-200">
                <p className="text-xs text-gray-700 italic">
                  "Great service!"
                </p>
              </div>
              <p className="text-xs font-semibold text-green-700">
                ✓ Share with team
              </p>
            </div>

            {/* Suggestion */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <Lightbulb className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Suggestion</h3>
              <p className="text-sm text-gray-600 mb-3">
                Ideas for improvement or new features.
              </p>
              <div className="bg-gray-50 rounded p-3 mb-3 border border-gray-200">
                <p className="text-xs text-gray-700 italic">
                  "How about..."
                </p>
              </div>
              <p className="text-xs font-semibold text-blue-700">
                ✓ Route to product
              </p>
            </div>

            {/* Complaint */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <AlertCircle className="w-8 h-8 text-orange-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Complaint</h3>
              <p className="text-sm text-gray-600 mb-3">
                Issues or problems that need resolution.
              </p>
              <div className="bg-gray-50 rounded p-3 mb-3 border border-gray-200">
                <p className="text-xs text-gray-700 italic">
                  "I had a problem..."
                </p>
              </div>
              <p className="text-xs font-semibold text-orange-700">
                ✓ Send to support
              </p>
            </div>

            {/* Urgent Issue */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <Zap className="w-8 h-8 text-red-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Urgent Issue</h3>
              <p className="text-sm text-gray-600 mb-3">
                Critical problems needing immediate attention.
              </p>
              <div className="bg-gray-50 rounded p-3 mb-3 border border-gray-200">
                <p className="text-xs text-gray-700 italic">
                  "System is down!"
                </p>
              </div>
              <p className="text-xs font-semibold text-red-700">
                ✓ Alert management
              </p>
            </div>
          </div>

          {/* Analysis Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Sentiment Analysis */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  Sentiment Analysis
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Positive", percent: 78, color: "bg-green-500" },
                    { label: "Neutral", percent: 15, color: "bg-blue-500" },
                    { label: "Negative", percent: 7, color: "bg-red-500" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">
                          {item.label}
                        </span>
                        <span className="text-xs font-bold text-gray-900">
                          {item.percent}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  Common Keywords & Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Customer Service",
                    "Response Time",
                    "Friendly Staff",
                    "Resolution",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle & Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Priority Level */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Priority Level</h3>
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Appreciation
                    </p>
                    <p className="text-xs text-gray-600">Low Priority</p>
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  Recommended Actions for Management
                </h3>
                <ul className="space-y-2">
                  {[
                    "Share with team for motivation",
                    "Feature in company newsletter",
                    "Send thank you message",
                    "Use as testimonial",
                  ].map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: VOICE THANK YOU */}
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Voice Thank You
          </h2>
          <p className="text-gray-600 mb-8">
            Express appreciation with your voice.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Microphone Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <Mic className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Start Recording</h3>
              <p className="text-sm text-gray-600 mb-6">
                Use your voice to say thank you.
              </p>
              <button className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition text-sm">
                Record Message
              </button>
            </div>

            {/* Recording Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <Volume2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Recording...</h3>
              <div className="bg-gray-100 rounded p-4 mb-6">
                <p className="text-3xl font-bold text-purple-600">0:23</p>
              </div>
              <button className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm">
                Stop & Save
              </button>
            </div>

            {/* Confirmation Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Message Saved</h3>
              <p className="text-sm text-gray-600 mb-6 italic">
                "Thank you for amazing support..."
              </p>
              <button className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm">
                Submit Message
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: MANAGEMENT DASHBOARD */}
      <section id="dashboard" className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Management Dashboard
          </h2>
          <p className="text-gray-600 mb-8">
            AI-powered insights for data-driven decisions.
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total Feedbacks", value: "2,847", icon: MessageSquare },
              { label: "Appreciation", value: "2,124", icon: ThumbsUp },
              { label: "Suggestions", value: "512", icon: Lightbulb },
              { label: "Complaints", value: "211", icon: AlertCircle },
              { label: "Urgent Issues", value: "12", icon: Zap },
            ].map(({ label, value, icon: Icon }, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600">{label}</p>
                  <Icon className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Charts & Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feedback Trend Chart */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Feedback Trend
              </h3>
              <div className="h-40 flex items-end justify-around gap-2">
                {[35, 42, 38, 55, 48, 62, 71, 69, 78, 85, 82, 90].map((v, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-purple-500 rounded-t transition hover:bg-purple-600"
                      style={{ height: `${v}%` }}
                    />
                    <span className="text-xs text-gray-500 mt-1">
                      {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice Messages */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-purple-600" />
                Recent Voice Messages
              </h3>
              <div className="space-y-3">
                {[
                  "Amazing team!",
                  "Love the experience!",
                  "Great support",
                ].map((msg, i) => (
                  <div key={i} className="bg-gray-50 rounded p-3 border border-gray-200">
                    <p className="text-xs text-gray-700">{msg}</p>
                    <p className="text-xs text-gray-500 mt-1">2h ago</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sentiment & Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Sentiment Donut */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                Sentiment Distribution
              </h3>
              <div className="flex items-center justify-between">
                <div className="w-32 h-32 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="160 360" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="36 360" strokeDashoffset="-160" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="25 360" strokeDashoffset="-196" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-gray-900">75%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-gray-700">Positive: 61%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-xs text-gray-700">Neutral: 15%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-xs text-gray-700">Negative: 10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Topics */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Top Topics
              </h3>
              <div className="space-y-3">
                {[
                  { topic: "Support Quality", count: 342 },
                  { topic: "Product Features", count: 298 },
                  { topic: "User Experience", count: 267 },
                  { topic: "Pricing", count: 156 },
                ].map(({ topic, count }) => (
                  <div key={topic}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">{topic}</span>
                      <span className="font-bold text-purple-600">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(count / 342) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Features & Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Key Features */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Key Features</h3>
              <ul className="space-y-2">
                {[
                  "AI-powered sentiment analysis",
                  "Automatic feedback categorization",
                  "Real-time insights dashboard",
                  "Voice & text support",
                  "Management actions",
                  "Secure data handling",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Benefits</h3>
              <ul className="space-y-2">
                {[
                  "Faster response to feedback",
                  "Improved team morale",
                  "Data-driven decisions",
                  "Better customer satisfaction",
                  "Proactive issue solving",
                  "Competitive advantage",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-purple-600 text-white py-8 border-t border-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-wrap justify-center gap-4 mb-4 text-sm font-semibold">
            <span>✓ Secure</span>
            <span>✓ Smart</span>
            <span>✓ AI Powered</span>
            <span>✓ User Friendly</span>
          </div>
          <p className="text-base">
            Your feedback drives our improvement.
          </p>
        </div>
      </footer>
    </div>
  );
}
