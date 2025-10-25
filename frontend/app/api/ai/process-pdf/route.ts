import { NextResponse } from "next/server"
import { savePdfAnalysisToMongo, saveGeneratedQuizToMongo } from "@/lib/mongodb"
import Groq from "groq"
import fs from "fs/promises"
import path from "path"

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.AI_API_KEY || "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"
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3-3-70b-versatile-128k"

if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set. AI calls will fail until configured.")
}

const GroqClient: any = (Groq as any)
// @ts-ignore
const groq = new GroqClient({ apiKey: GROQ_API_KEY })

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get("file") as File | null
    const address = (form.get("address") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    // Save uploaded file to public/files for serving
    const arrayBuffer = await (file as File).arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filesDir = path.join(process.cwd(), "frontend", "public", "files")
    try {
      await fs.mkdir(filesDir, { recursive: true })
    } catch (e) {
      // ignore
    }

    const safeName = `${Date.now()}-${(file as any).name || "upload.pdf"}`.replace(/[^a-zA-Z0-9.\-_/]/g, "-")
    const filePath = path.join(filesDir, safeName)
    await fs.writeFile(filePath, buffer)
    const fileUrl = `/files/${safeName}`

    // Convert to base64 for model input (note: large files may be problematic; consider text extraction)
    const base64 = buffer.toString("base64")

    // Build a concise prompt asking Groq Llama to return strict JSON with summary (2-3 lines) and bullets
    const prompt = `You are an assistant that receives a PDF encoded as base64.
Extract the most important information and return ONLY valid JSON with the keys: summary (2-3 short lines), bullets (3-4 concise bullet points).
Do NOT include extra commentary. The JSON shape: {"summary":"...","bullets":["..."]}.
Here is the file name: ${(file as any).name || safeName}
Here is the base64 content: ${base64}`

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    })

    const text = completion?.choices?.[0]?.message?.content || ""

    // Try parse provider response as JSON
    let result: any = null
    try {
      result = JSON.parse(text)
    } catch (e) {
      const m = text.match(/\{[\s\S]*\}/)
      if (m) {
        try {
          result = JSON.parse(m[0])
        } catch (e2) {
          console.error("Failed to parse Groq output as JSON", e2)
        }
      }
    }

    if (!result) {
      console.error("Unrecognized Groq response:", text)
      return NextResponse.json({ error: "Unrecognized AI response", raw: text }, { status: 502 })
    }

    const { summary, bullets } = result

    // Persist analysis and record the stored file URL
    await savePdfAnalysisToMongo({ userAddress: address, fileName: (file as any).name || safeName, fileUrl, summary, bullets, quiz: result.quiz || null })
    if (result.quiz) {
      await saveGeneratedQuizToMongo({ userAddress: address, fileName: (file as any).name || safeName, fileUrl, quiz: result.quiz })
    }

    return NextResponse.json({ success: true, data: { summary, bullets, quiz: result.quiz || null, fileUrl } })
  } catch (err) {
    console.error("AI process error:", err)
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 })
  }
}
