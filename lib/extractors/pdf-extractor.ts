// PDF Text Extraction Service
export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log("[v0] Starting PDF extraction...")

    const uint8Array = new Uint8Array(arrayBuffer)
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")

    // Set worker source to null for server-side rendering
    pdfjsLib.GlobalWorkerOptions.workerSrc = ""

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
    const pdf = await loadingTask.promise

    console.log(`[v0] PDF has ${pdf.numPages} pages`)

    let fullText = ""

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .filter((str: string) => str.trim().length > 0)
        .join(" ")

      if (pageText.trim()) {
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`
      }
    }

    console.log(`[v0] Successfully extracted ${fullText.length} characters from PDF`)
    return fullText.trim()
  } catch (error) {
    console.error("[v0] PDF extraction error:", error)
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
