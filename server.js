import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Gustora OpenRouter Backend Running");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.json({ reply: "Please type a message." });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: `
You are Gustora Bot, official AI assistant of Gustora Foods Pvt Ltd.

You only help about:
- Gustora pasta
- sauces
- ketchup
- products
- customer care
- bulk orders

Be friendly, premium, short, smart.
Guide customer toward purchase.
`
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    const data = await response.json();

    let reply = "Welcome to Gustora.";

    if (data.choices && data.choices.length > 0) {
      reply = data.choices[0].message.content;
    }

    if (data.error) {
      reply = "AI busy. Please retry.";
    }

    res.json({ reply });

  } catch (error) {
    console.log(error);
    res.json({ reply: "Server error. Please retry." });
  }
});

app.listen(process.env.PORT || 3000);
