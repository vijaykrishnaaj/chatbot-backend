import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

/* ------------------ HEALTH CHECK ------------------ */
app.get("/", (req, res) => {
  res.send("Gustora Chatbot Backend Running ✅");
});

/* ------------------ CHECK MODELS ------------------ */
app.get("/models", async (req, res) => {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.API_KEY}`
    );
    const d = await r.json();
    res.json(d);
  } catch (err) {
    res.json({ error: "Failed to fetch models" });
  }
});

/* ------------------ CHAT ROUTE ------------------ */
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  console.log("Incoming:", userMessage);

  if (!userMessage) {
    return res.json({ reply: "Please send a message." });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are Gustora Bot, assistant of Gustora Foods Pvt Ltd.

IDENTITY:
- You are Gustora Bot (only mention when asked)
- Never say you are AI or Google

ROLE:
- Help users choose pasta
- Suggest products
- Guide purchase

BEHAVIOR:
- Answer the user's question directly
- Recommend relevant products
- Ask follow-up questions
- Keep answers short and friendly

PRODUCT KNOWLEDGE:
- Short pasta: Penne, Fusilli, Macaroni
- Long pasta: Spaghetti, Linguine
- Healthy: Multimillet, Quinoa
- Kids pasta
- Instant pasta
- Sauces

RULE:
- If question is unrelated → say:
"I can help only with Gustora products and services."

USER MESSAGE:
${userMessage}
`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.6
          }
        })
      }
    );

    const data = await response.json();

    console.log("Gemini:", JSON.stringify(data, null, 2));

    let reply = "No response from AI";

    if (data.candidates && data.candidates.length > 0) {
      reply = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      reply = "API Error: " + data.error.message;
    }

    /* ------------------ EXTRA CONTROL (VERY IMPORTANT) ------------------ */

    const lower = reply.toLowerCase();

    // 🔒 Identity enforcement
    if (
      lower.includes("language model") ||
      lower.includes("trained by google") ||
      lower.includes("gemini")
    ) {
      reply = "I am Gustora Bot, your assistant for Gustora Foods Pvt Ltd.";
    }

    // 🏷 Ensure branding always visible
    if (!lower.includes("gustora")) {
      reply = "Gustora Bot 👋\n\n" + reply;
    }

    // 📧 Customer support handling
    if (
      lower.includes("complaint") ||
      lower.includes("issue") ||
      lower.includes("problem")
    ) {
      reply += "\n\nFor assistance, contact: branding@gustora.co";
    }

    res.json({ reply });

  } catch (error) {
    console.error("Server error:", error);
    res.json({ reply: "Server error. Please try again." });
  }
});

/* ------------------ PORT ------------------ */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
