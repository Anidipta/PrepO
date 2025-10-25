import { NextResponse } from "next/server"
import { savePdfAnalysisToMongo, saveGeneratedQuizToMongo } from "@/lib/mongodb"
import Groq from "groq-sdk"
import fs from "fs/promises"
import path from "path"

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.AI_API_KEY || "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"
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"

if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set. AI calls will fail until configured.")
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get("file") as File | null
    const address = (form.get("address") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    // Save uploaded file to public/files for serving
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filesDir = path.join(process.cwd(), "public", "files")
    
    try {
      await fs.mkdir(filesDir, { recursive: true })
    } catch (e) {
      // Directory already exists or permission error
      console.warn("Directory creation warning:", e)
    }

    const safeName = `${Date.now()}-${file.name || "upload.pdf"}`.replace(/[^a-zA-Z0-9.\-_]/g, "-")
    const filePath = path.join(filesDir, safeName)
    await fs.writeFile(filePath, buffer)
    const fileUrl = `/files/${safeName}`

    // Convert to base64 for model input
    const base64 = buffer.toString("base64")

    // Build a concise prompt asking Groq to return strict JSON
    const prompt = `You are an assistant that analyzes PDF documents.
The PDF content is provided as base64 below. Extract the key information and return ONLY valid JSON with this exact structure:
{
  "summary": "A 2-3 sentence summary of the document",
  "bullets": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"]
}

Do NOT include any other text, explanation, or markdown formatting. Return ONLY the JSON object.

File name: ${file.name || safeName}
Base64 content: ${base64.substring(0, 50000)}`

    // Initialize Groq client
    const groqClient = new Groq({ 
      apiKey: GROQ_API_KEY 
    })

    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const text = completion?.choices?.[0]?.message?.content || ""

    // Parse AI response as JSON
    let result: { summary: string; bullets: string[]; quiz?: any } | null = null
    
    try {
      result = JSON.parse(text)
    } catch (e) {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0])
        } catch (e2) {
          console.error("Failed to parse JSON from AI response:", e2)
        }
      }
    }

    if (!result || !result.summary || !result.bullets) {
      console.error("Invalid AI response format:", text)
      return NextResponse.json({ 
        error: "AI returned invalid response format", 
        raw: text.substring(0, 500) 
      }, { status: 502 })
    }

    const { summary, bullets, quiz } = result

    // Persist analysis with file URL
    await savePdfAnalysisToMongo({ 
      userAddress: address, 
      fileName: file.name || safeName, 
      fileUrl, 
      summary, 
      bullets, 
      quiz: quiz || null 
    })

    // Save quiz if present
    if (quiz) {
      await saveGeneratedQuizToMongo({ 
        userAddress: address, 
        fileName: file.name || safeName, 
        fileUrl, 
        quiz 
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        summary, 
        bullets, 
        quiz: quiz || null, 
        fileUrl 
      } 
    })
    
  } catch (err) {
    console.error("PDF processing error:", err)
    return NextResponse.json({ 
      error: "Failed to process PDF",
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 })
  }
}