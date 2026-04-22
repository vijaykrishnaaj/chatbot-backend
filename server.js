import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Gustora HF Backend Running");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.json({ reply: "Please enter message." });
  }

  const prompt = `
You are Gustora Bot, official assistant of Gustora Foods Pvt Ltd.
Only discuss Gustora pasta, sauces, ketchup, customer support.
Be helpful, premium, short, smart.

User: ${userMessage}
Assistant:
`;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt
        })
      }
    );

    const data = await response.json();

    let reply = "Welcome to Gustora. How may I help you?";

    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    }

    if (data.error) {
      reply = "AI model loading. Please retry in 20 seconds.";
    }

    res.json({ reply });

  } catch (error) {
    console.log(error);
    res.json({ reply: "Server error. Please retry." });
  }
});

app.listen(process.env.PORT || 3000);
