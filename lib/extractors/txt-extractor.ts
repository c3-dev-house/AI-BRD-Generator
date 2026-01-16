// Text File Extraction Service
export async function extractTextFile(file: File): Promise<string> {
  try {
    console.log("[v0] Starting text file extraction...")

    const text = await file.text()

    if (!text || text.trim().length === 0) {
      throw new Error("Text file is empty")
    }

    console.log(`[v0] Successfully extracted ${text.length} characters from text file`)
    return text.trim()
  } catch (error) {
    console.error("[v0] Text extraction error:", error)
    throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
