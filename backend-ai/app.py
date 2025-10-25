from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from groq import Groq
import os
import json
import base64
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

app = FastAPI()

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("AI_API_KEY") or "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"
GROQ_MODEL = os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile"

if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY is not set. AI calls will fail.")

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY)

# Create files directory
FILES_DIR = Path("public/files")
FILES_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and invalid characters."""
    timestamp = int(datetime.now().timestamp() * 1000)
    safe_name = re.sub(r'[^a-zA-Z0-9.\-_]', '-', filename)
    return f"{timestamp}-{safe_name}"


def truncate_base64(base64_str: str, max_chars: int = 50000) -> str:
    """Truncate base64 string to prevent token limit issues."""
    return base64_str[:max_chars]


@app.post("/api/analyze-pdf")
async def analyze_pdf(
    file: UploadFile = File(...),
    address: Optional[str] = Form("")
):
    """
    Analyze a PDF file and generate summary, key points, and quiz.
    
    Args:
        file: PDF file to analyze
        address: User wallet address (optional)
    
    Returns:
        JSON with summary, bullets, quiz, and file URL
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file content
        content = await file.read()
        
        # Save file to public directory
        safe_filename = sanitize_filename(file.filename)
        file_path = FILES_DIR / safe_filename
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        file_url = f"/files/{safe_filename}"
        
        # Convert to base64
        base64_content = base64.b64encode(content).decode('utf-8')
        truncated_base64 = truncate_base64(base64_content, 50000)
        
        # Create prompt for AI
        prompt = f"""You are an assistant that analyzes PDF documents.
The PDF content is provided as base64 below. Extract the key information and return ONLY valid JSON with this exact structure:
{{
  "summary": "A 2-3 sentence summary of the document",
  "bullets": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
  "quiz": [
    {{
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0
    }}
  ]
}}

Generate 3-5 quiz questions based on the document content. Each question should have 4 options and the correct_answer should be the index (0-3) of the correct option.

Do NOT include any other text, explanation, or markdown formatting. Return ONLY the JSON object.

File name: {file.filename}
Base64 content: {truncated_base64}"""
        
        # Call Groq API
        try:
            completion = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2048,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            response_text = completion.choices[0].message.content or ""
            
        except Exception as e:
            print(f"Groq API error: {e}")
            raise HTTPException(status_code=502, detail=f"AI provider error: {str(e)}")
        
        # Parse JSON response
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                try:
                    result = json.loads(json_match.group(0))
                except json.JSONDecodeError as e:
                    print(f"Failed to parse JSON: {e}")
                    raise HTTPException(
                        status_code=502,
                        detail="AI returned invalid JSON format"
                    )
            else:
                raise HTTPException(
                    status_code=502,
                    detail="Could not extract JSON from AI response"
                )
        
        # Validate response structure
        if not isinstance(result, dict) or "summary" not in result or "bullets" not in result:
            raise HTTPException(
                status_code=502,
                detail="AI response missing required fields (summary, bullets)"
            )
        
        # Extract data
        summary = result.get("summary", "")
        bullets = result.get("bullets", [])
        quiz = result.get("quiz", [])
        
        # Optional: Save to MongoDB (implement your own function)
        # await save_to_mongodb(address, file.filename, file_url, summary, bullets, quiz)
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "summary": summary,
                "bullets": bullets,
                "quiz": quiz,
                "fileUrl": file_url,
                "address": address
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"PDF processing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process PDF: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "pdf-analysis-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)