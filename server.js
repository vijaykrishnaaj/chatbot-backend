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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: userMessage }]
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
