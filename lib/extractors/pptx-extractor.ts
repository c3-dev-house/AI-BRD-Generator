// PowerPoint Text Extraction Service
export async function extractPptxText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log("[v0] Starting PowerPoint extraction...")

    const PizZip = (await import("pizzip")).default
    const zip = new PizZip(arrayBuffer)

    let fullText = ""

    // Extract text from slides
    const slideFiles = Object.keys(zip.files)
      .filter((name) => name.match(/ppt\/slides\/slide\d+\.xml/))
      .sort((a, b) => {
        const numA = Number.parseInt(a.match(/\d+/)?.[0] || "0")
        const numB = Number.parseInt(b.match(/\d+/)?.[0] || "0")
        return numA - numB
      })

    console.log(`[v0] Found ${slideFiles.length} slides in PowerPoint`)

    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i]
      const content = zip.files[slideFile].asText()

      // Extract text from XML - remove tags and clean up
      const text = content
        .replace(/<a:t[^>]*>/g, "")
        .replace(/<\/a:t>/g, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()

      if (text) {
        fullText += `\n--- Slide ${i + 1} ---\n${text}\n`
      }
    }

    if (!fullText.trim()) {
      throw new Error("PowerPoint file contains no extractable text")
    }

    console.log(`[v0] Successfully extracted ${fullText.length} characters from PowerPoint`)
    return fullText.trim()
  } catch (error) {
    console.error("[v0] PowerPoint extraction error:", error)
    throw new Error(`PowerPoint extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
