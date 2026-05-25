import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Instantiate Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fail until configured.");
  }
  
  // Lazily construct the Gemini client so it doesn't crash if apiKey is missing
  const getGeminiClient = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required in settings/secrets.");
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API Route: AI Column processing
  app.post("/api/gemini/run-column", async (req, res) => {
    try {
      const { promptTemplate, rowData } = req.body;
      
      if (!promptTemplate) {
        return res.status(400).json({ error: "Missing promptTemplate" });
      }

      const ai = getGeminiClient();

      // Build context details
      let rowContentDescription = "";
      if (rowData) {
        rowContentDescription = Object.entries(rowData)
          .map(([key, value]) => `${key}: "${value}"`)
          .join(", ");
      }

      // Replace variables in templates
      let processedPrompt = promptTemplate;
      if (rowData) {
        Object.entries(rowData).forEach(([key, value]) => {
          const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
          processedPrompt = processedPrompt.replace(placeholder, String(value || ""));
        });
      }

      const systemInstruction = 
        "You are an AI spreadsheet column formula runner in an app called Origami Chat. " +
        "Your task is to evaluate the prompt based on the provided row context. " +
        "Reply ONLY with the final result of the prompt evaluation. Do NOT include markdown styling blocks, quotes, reasons, or chit-chat unless explicitly asked. Keep it concise and professional.";

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: `Row Context:\n${rowContentDescription}\n\nPrompt To Evaluate: ${processedPrompt}` }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.2,
          maxOutputTokens: 500,
        }
      });

      const text = response.text?.trim() || "";
      res.json({ result: text });
    } catch (error: any) {
      console.error("AI Column Error:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // API Route: Grounded Chat Assistant
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { messages, tableSchema, tableRows } = req.body;
      const ai = getGeminiClient();

      // format table content for grounding
      const formattedCols = tableSchema?.columns?.map((c: any) => `${c.name} (${c.type})`).join(", ") || "None";
      const formattedRows = tableRows?.map((r: any, idx: number) => {
        return `Row ${idx + 1}: ` + Object.entries(r)
          .filter(([k]) => k !== "id")
          .map(([k, v]) => `${k}="${v}"`)
          .join(", ");
      }).join("\n") || "No data rows in this table.";

      const tableName = tableSchema?.name || "Untitled Table";

      const systemInstruction = 
        `You are a helpful database-grounded chat assistant called 'FounderDeck AI Scout'.\n` +
        `You are fully grounded on the user's active directory **"${tableName}"**.\n\n` +
        `CURRENT VAULT STRUCTURE:\nColumns: ${formattedCols}\n\n` +
        `CURRENT DATA IN VAULT:\n${formattedRows}\n\n` +
        `HOW YOU CAN INTERACT IN CHAT:\n` +
        `1. Summarize, analyze, filter, sort, search, or explain directory data.\n` +
        `2. KEYWORD & NICHE FILTERING DIRECTIVE:\n` +
        `   - If the user asks for leads, candidates, founders, or specific playbooks, scan the rows to detect matching niches, bio descriptions, ARR, and relevant keywords.\n` +
        `   - Formulate and exhibit the matched rows clearly in a premium, beautifully bulleted or tabular list format. Highlight exact keyword synergy indices (e.g., 'Matches Niche: Spatial computing').\n` +
        `3. Perform AI operations on table records.\n` +
        `4. Provide structured commands to modify the directory if requested.\n\n` +
        `CRITICAL DIRECTIVE:\n` +
        `If the user wants you to modify the directory (e.g., 'add founder Lucas at startup CodeVibe with ARR 120000', 'delete row 2', 'update ARR to 500000'), you MUST output a structured JSON directive inside your response using the following format under a separator '---ACTION---':\n\n` +
        `---ACTION---\n` +
        `{\n` +
        `  "action": "ADD_ROW" | "UPDATE_ROW" | "DELETE_ROW",\n` +
        `  "rowData": { "ColumnName": "Value", ... },\n` +
        `  "rowIndex": number (0-based index for UPDATE/DELETE)\n` +
        `}\n\n` +
        `Please ensure the action block matches this exact formatting. Do not wrap the JSON inside markdown code blocks like \`\`\`json. Keep your conversational part helpful and descriptive. Explain the action you are taking.`;

      const genaiMessages = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: genaiMessages,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      });

      const text = response.text || "";
      res.json({ result: text });
    } catch (error: any) {
      console.error("Chat AI error:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  app.post("/api/airtable/sync-table", async (req, res) => {
    try {
      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;
      const tableName = process.env.AIRTABLE_TABLE_NAME || "Founders";

      if (!apiKey || !baseId) {
        return res.json({ skipped: true, reason: "Airtable env vars are not configured." });
      }

      const { table } = req.body;
      if (!table?.rows || !Array.isArray(table.rows)) {
        return res.status(400).json({ error: "Missing table rows." });
      }

      const endpoint = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
      const rows = table.rows.slice(-10).map((row: Record<string, any>) => ({
        fields: {
          "Local Row ID": String(row.id || ""),
          "Source Table": String(table.name || ""),
          ...Object.fromEntries(
            Object.entries(row)
              .filter(([key]) => key !== "id")
              .map(([key, value]) => [key, value === undefined || value === null ? "" : String(value)])
          ),
        },
      }));

      if (!rows.length) {
        return res.json({ synced: 0 });
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          performUpsert: {
            fieldsToMergeOn: ["Local Row ID"],
          },
          records: rows,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("Airtable sync error:", result);
        return res.status(response.status).json(result);
      }

      res.json({ synced: result.records?.length || 0 });
    } catch (error: any) {
      console.error("Airtable sync route error:", error);
      res.status(500).json({ error: error?.message || "Airtable sync failed." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
