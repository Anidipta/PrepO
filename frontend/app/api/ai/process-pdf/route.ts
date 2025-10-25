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

    // Forward the uploaded file to the external AI service
    const AI_URL = process.env.AI_SERVICE_URL || "https://prepo-ai.onrender.com/api/analyze-pdf"

    // Build form data to send to external AI service
    const externalForm = new FormData()
    externalForm.append("file", file as unknown as Blob, file?.name || safeName)
    if (address) externalForm.append("address", address)

    const aiResp = await fetch(AI_URL, { method: "POST", body: externalForm })
    if (!aiResp.ok) {
      const txt = await aiResp.text().catch(() => "")
      console.error("AI service returned error:", aiResp.status, txt)
      return NextResponse.json({ error: "AI service error", details: txt }, { status: 502 })
    }

    const aiJson = await aiResp.json().catch(() => null)
    if (!aiJson || !aiJson.success || !aiJson.data) {
      console.error("Invalid AI response:", aiJson)
      return NextResponse.json({ error: "Invalid AI response" }, { status: 502 })
    }

    const { summary, bullets, quiz, fileUrl: remoteFileUrl } = aiJson.data

    // Persist analysis with file URL. Prefer remote fileUrl returned by AI service if present,
    // otherwise use the locally saved `fileUrl`.
    const storedFileUrl = remoteFileUrl || fileUrl
    await savePdfAnalysisToMongo({
      userAddress: address,
      fileName: file.name || safeName,
      fileUrl: storedFileUrl,
      summary,
      bullets,
      quiz: quiz || null,
    })

    // Save quiz if present
    if (quiz) {
      await saveGeneratedQuizToMongo({
        userAddress: address,
        fileName: file.name || safeName,
        fileUrl: storedFileUrl,
        quiz,
      })
    }

    return NextResponse.json({ success: true, data: { summary, bullets, quiz: quiz || null, fileUrl: storedFileUrl, address } })
    
  } catch (err) {
    console.error("PDF processing error:", err)
    return NextResponse.json({ 
      error: "Failed to process PDF",
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 })
  }
}