// DOCX Text Extraction Service
export async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log("[v0] Starting DOCX extraction...")

    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ arrayBuffer })

    if (!result.value || result.value.trim().length === 0) {
      throw new Error("DOCX file contains no extractable text")
    }

    console.log(`[v0] Successfully extracted ${result.value.length} characters from DOCX`)
    return result.value.trim()
  } catch (error) {
    console.error("[v0] DOCX extraction error:", error)
    throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
