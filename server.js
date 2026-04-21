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
- Only mention identity if user asks "who are you"
- Never say you are AI, model, or Google

ROLE:
- Help users choose pasta
- Recommend products
- Guide purchase

BEHAVIOR:
- Always answer the user's question
- Recommend 1–2 relevant products
- Ask 1 follow-up question
- Keep responses short, friendly, helpful

RULES:
- If user mentions kids → suggest Kids Pasta or Fusilli
- If user wants healthy → suggest Multimillet or Quinoa pasta
- If user wants quick → suggest Instant pasta
- If unrelated → say:
"I can help only with Gustora products and services."

EXAMPLE STYLE:
"Great choice! Fusilli works really well for kids 😊  
Do you want something quick or a healthy option?"

USER:
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

    console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));

    /* ------------------ SAFE HANDLING ------------------ */

    // API error
    if (data.error) {
      return res.json({
        reply: "⚠️ " + data.error.message
      });
    }

    // No valid response
    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts
    ) {
      return res.json({
        reply: "⚠️ No response from AI. Please try again."
      });
    }

    let reply = data.candidates[0].content.parts[0].text;

    /* ------------------ LIGHT CONTROL (SAFE) ------------------ */

    const lower = reply.toLowerCase();

    // Only fix if model reveals identity wrongly
    if (
      lower.includes("language model") ||
      lower.includes("trained by google")
    ) {
      reply =
        "I am Gustora Bot, your assistant for Gustora Foods Pvt Ltd. How can I help you today?";
    }

    // Customer support
    if (
      lower.includes("complaint") ||
      lower.includes("issue") ||
      lower.includes("problem")
    ) {
      reply += "\n\nFor support, contact: branding@gustora.co";
    }

    res.json({ reply });

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);

    res.json({
      reply: "⚠️ Server error. Please try again in a moment."
    });
  }
});

/* ------------------ PORT ------------------ */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
