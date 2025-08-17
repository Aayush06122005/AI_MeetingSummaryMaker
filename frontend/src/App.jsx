import { useState } from "react";
import { Loader2, Send, Mail, FileText, Upload } from "lucide-react";

export default function App() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [prompt, setPrompt] = useState("Summarize in bullet points for executives.");
  const [summary, setSummary] = useState("");
  const [emails, setEmails] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle transcript file upload
  const handleFile = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) {
      try {
        setTranscript(await f.text());
        setStatus(`✅ File "${f.name}" loaded successfully.`);
      } catch (err) {
        setStatus("❌ Failed to read file.");
      }
    }
  };

  // Call backend to generate summary
  const generateSummary = async () => {
    if (!transcript.trim()) {
      setStatus("❌ Transcript required to generate a summary.");
      return;
    }
    setLoading(true);
    setStatus("⏳ Generating summary...");

    try {
      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, prompt }),
      });

      if (!resp.ok) throw new Error("Failed to generate summary.");
      const data = await resp.json();

      setSummary(data.summary || "");
      setStatus("✅ Summary ready! You can now edit and share it.");
    } catch (err) {
      setStatus("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Call backend to send email
  const sendEmail = async () => {
    if (!summary.trim()) {
      setStatus("❌ Please generate a summary first.");
      return;
    }
    const to = emails.split(",").map((e) => e.trim()).filter(Boolean);
    if (!to.length) {
      setStatus("❌ At least one recipient is required.");
      return;
    }
    setLoading(true);
    setStatus("📤 Sending email...");

    try {
      const resp = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, to }),
      });

      if (!resp.ok) throw new Error("Failed to send email.");
      setStatus("✅ Email sent successfully!");
    } catch (err) {
      setStatus("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 flex justify-center items-center">
      <div className="w-full max-w-6xl bg-slate-900 rounded-2xl shadow-2xl p-6 md:p-10 space-y-8 border border-slate-700">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-indigo-400 mb-2 drop-shadow-lg">
            AI Meeting Summarizer
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Quickly summarize meeting transcripts and share key insights with your team. Simply upload a text file or paste your transcript to get started.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left side: transcript + prompt */}
          <div className="space-y-6">
            {/* Transcript input */}
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <label className="font-semibold text-slate-300 block mb-3 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Meeting Transcript
              </label>
              <div className="flex items-center gap-4">
                <label className="relative flex items-center justify-center bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm cursor-pointer hover:bg-indigo-700 transition">
                  <Upload className="w-4 h-4 mr-2" />
                  {file ? file.name : 'Upload .txt file'}
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
                {file && (
                  <span className="text-xs text-slate-400">
                    File ready.
                  </span>
                )}
              </div>
              <textarea
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-4 mt-4 text-sm h-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="Or paste your transcript here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </div>

            {/* Prompt input */}
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <label className="font-semibold text-slate-300 block mb-3 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Custom Instruction
              </label>
              <textarea
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-4 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
          </div>

          {/* Right side: summary + email */}
          <div className="space-y-6">
            {/* Generate summary */}
            <button
              onClick={generateSummary}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:shadow-none disabled:transform-none"
            >
              {loading ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : (
                <Send className="w-6 h-6" />
              )}
              {loading ? "Generating..." : "Generate Summary"}
            </button>

            {/* Editable summary */}
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <label className="font-semibold text-slate-300 block mb-3 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Editable Summary
              </label>
              <textarea
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-4 text-sm h-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="Your generated summary will appear here..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            {/* Email input */}
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <label className="font-semibold text-slate-300 block mb-3 text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                Recipients (comma separated)
              </label>
              <input
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="e.g. ceo@acme.com, pm@acme.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
              />
            </div>

            {/* Send email */}
            <button
              onClick={sendEmail}
              disabled={loading || !summary}
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-green-600 to-teal-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:shadow-none disabled:transform-none"
            >
              {loading ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : (
                <Send className="w-6 h-6" />
              )}
              Send Summary Email
            </button>
          </div>
        </div>

        {/* Status message */}
        {status && (
          <div className="flex justify-center pt-4">
            <div
              className={`text-sm rounded-lg p-3 w-full max-w-xl text-center
              ${status.startsWith("✅") ? "bg-green-600/20 text-green-300" :
                status.startsWith("❌") ? "bg-red-600/20 text-red-300" :
                  "bg-yellow-600/20 text-yellow-300"}`}
            >
              {status}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
