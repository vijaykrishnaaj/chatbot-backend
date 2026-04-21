import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Health check route (optional but useful)
app.get("/", (req, res) => {
  res.send("Chatbot backend is running");
});
app.get("/models", async (req, res) => {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${process.env.API_KEY}`
  );
  const d = await r.json();
  res.json(d);
});
// Chat route
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  console.log("Incoming message:", userMessage);

  // Safety check
  if (!userMessage) {
    return res.json({ reply: "No message provided" });
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
      role: "user",
      parts: [
        {
          text: `
You are Gustora Bot, an expert AI assistant representing Gustora – Indo-Italian premium pasta company.

## ROLE
Act as a smart, friendly customer assistant. Help users choose products, suggest pasta, and guide purchases.

## BRAND
- Premium Indo-Italian pasta
- Durum wheat semolina
- Slow drying, bronze extrusion
- Better sauce absorption

## PRODUCTS
Short pasta: Penne, Fusilli, Macaroni, etc.
Long pasta: Spaghetti, Linguine, etc.
Speciali: Rigatoni, Lasagne, etc.
Healthy: Multimillet, Quinoa, Whole wheat
Kids pasta, Instant pasta, Sauces

## RULES
- Only talk about Gustora products
- If unrelated: say “I can help only with Gustora products and services”
- Be friendly, short, helpful
- Ask follow-up questions

## SALES BEHAVIOR
- Recommend products
- Suggest combos (pasta + sauce)
- Guide user decision

Customer question:
${userMessage}
`
        }
      ]
    }
  ]
})
  }
);
    const data = await response.json();

    console.log("Gemini response:", JSON.stringify(data, null, 2));

    let reply = "No response from AI";

    // Safe extraction
    if (data.candidates && data.candidates.length > 0) {
      reply = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      reply = "API Error: " + data.error.message;
    }

    res.json({ reply });

  } catch (error) {
    console.error("Server error:", error);
    res.json({ reply: "Server crashed" });
  }
});

// PORT (VERY IMPORTANT FOR RENDER)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
