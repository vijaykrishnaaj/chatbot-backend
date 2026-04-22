import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Gustora HuggingFace Backend Running");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.json({ reply: "Please type a message." });
  }

  const prompt = `
You are Gustora Bot, official AI assistant of Gustora Foods Pvt Ltd.

Rules:
- Only discuss Gustora products and customer support
- Be friendly, premium and helpful
- Suggest products smartly
- Convert interest into purchase
- If user asks unrelated things, politely redirect to Gustora products

Products:
- Penne Rigate
- Fusilli
- Macaroni
- Spaghetti
- Linguine
- Whole Wheat Pasta
- Multimillet Pasta
- Quinoa Pasta
- Kids Pasta
- Instant Pasta
- Sauces
- Ketchup

User: ${userMessage}
Assistant:
`;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-large",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 180,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();

    let reply = "Welcome to Gustora! How may I help you?";

    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    } else if (data.error) {
      reply = "AI busy right now. Please try again shortly.";
    }

    res.json({ reply });

  } catch (error) {
    console.log(error);
    res.json({ reply: "Server error. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
