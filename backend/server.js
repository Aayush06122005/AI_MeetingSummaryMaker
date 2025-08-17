import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

function badRequest(res, msg) {
  return res.status(400).json({ ok: false, error: msg });
}

// --- API: Generate Summary ---
app.post("/api/generate", async (req, res) => {
  try {
    const { transcript, prompt } = req.body;
    if (!transcript) return badRequest(res, "Transcript required");

    const userPrompt =
      (prompt && prompt.trim()) ||
      "Summarize in bullet points for executives.";

    const systemPrompt = `You are a meeting summarizer. 
- Follow user instructions exactly.
- Prefer bullet points.
- Include Action Items, Decisions, Open Questions if present.
- Do not invent info.`;

    const body = {
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Instruction: ${userPrompt}\n\nTranscript:\n${transcript}`,
        },
      ],
    };

    const resp = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await resp.json();
    console.log("Groq raw response:", JSON.stringify(data, null, 2));

    if (data.error) {
      return res.status(500).json({ ok: false, error: data.error.message });
    }

    // fallback: check for both "message.content" and "text"
    const summary =
      data?.choices?.[0]?.message?.content?.trim() ||
      data?.choices?.[0]?.text?.trim();

    if (!summary) {
      return res
        .status(500)
        .json({ ok: false, error: "Groq returned no summary content" });
    }

    res.json({ ok: true, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Unexpected server error" });
  }
});

// --- API: Share via Email (Nodemailer + Gmail) ---
app.post("/api/share", async (req, res) => {
  try {
    const { summary, to } = req.body;
    if (!summary) return badRequest(res, "Summary required");
    if (!to?.length) return badRequest(res, "Recipients required");

    // ✅ Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // Gmail address
        pass: process.env.GMAIL_PASS, // 16-digit app password
      },
    });

    // Handle multiple recipients
    const recipients = Array.isArray(to)
      ? to
      : to.split(",").map((e) => e.trim());

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipients,
      subject: "Meeting Summary",
      html: `<div style="font-family:Arial,sans-serif">
        <h2>Meeting Summary</h2>
        <div style="white-space:pre-wrap">${summary}</div>
      </div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);

    res.json({ ok: true, id: info.messageId });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ ok: false, error: "Email send failed" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
