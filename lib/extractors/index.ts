// Main Extraction Service - Central Hub for All File Extractors
import { extractPdfText } from "./pdf-extractor"
import { extractDocxText } from "./docx-extractor"
import { extractPptxText } from "./pptx-extractor"
import { extractTextFile } from "./txt-extractor"

export interface ExtractionResult {
  fileName: string
  text: string
  success: boolean
  error?: string
  fileSize: number
  extractedLength: number
}

export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  const fileName = file.name.toLowerCase()
  const fileSize = file.size

  console.log(`[v0] Processing file: ${file.name} (${(fileSize / 1024).toFixed(2)} KB)`)

  try {
    let extractedText = ""

    // Text-based files (TXT, MD, CSV)
    if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".csv")) {
      extractedText = await extractTextFile(file)
    }
    // JSON files
    else if (fileName.endsWith(".json")) {
      const text = await file.text()
      try {
        const json = JSON.parse(text)
        extractedText = JSON.stringify(json, null, 2)
      } catch {
        extractedText = text
      }
    }
    // PDF files
    else if (fileName.endsWith(".pdf")) {
      const arrayBuffer = await file.arrayBuffer()
      extractedText = await extractPdfText(arrayBuffer)
    }
    // DOCX files
    else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const arrayBuffer = await file.arrayBuffer()
      extractedText = await extractDocxText(arrayBuffer)
    }
    // PowerPoint files
    else if (fileName.endsWith(".pptx") || fileName.endsWith(".ppt")) {
      const arrayBuffer = await file.arrayBuffer()
      extractedText = await extractPptxText(arrayBuffer)
    }
    // Unsupported format
    else {
      throw new Error(`Unsupported file format: ${fileName}`)
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("No text content could be extracted from the file")
    }

    return {
      fileName: file.name,
      text: extractedText,
      success: true,
      fileSize,
      extractedLength: extractedText.length,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown extraction error"
    console.error(`[v0] Failed to extract ${file.name}:`, errorMessage)

    return {
      fileName: file.name,
      text: "",
      success: false,
      error: errorMessage,
      fileSize,
      extractedLength: 0,
    }
  }
}

export async function extractMultipleFiles(files: File[]): Promise<{
  combinedText: string
  results: ExtractionResult[]
  successCount: number
  totalLength: number
}> {
  console.log(`[v0] Starting extraction for ${files.length} file(s)`)

  const results = await Promise.all(files.map((file) => extractTextFromFile(file)))

  const successfulResults = results.filter((r) => r.success)
  const successCount = successfulResults.length

  const combinedText = successfulResults
    .map((result) => {
      const separator = "=".repeat(80)
      return `${separator}\nFILE: ${result.fileName}\nSIZE: ${(result.fileSize / 1024).toFixed(2)} KB\nEXTRACTED: ${result.extractedLength} characters\n${separator}\n\n${result.text}`
    })
    .join("\n\n\n")

  const totalLength = combinedText.length

  console.log(`[v0] Extraction complete: ${successCount}/${files.length} successful, ${totalLength} total characters`)

  return {
    combinedText,
    results,
    successCount,
    totalLength,
  }
}
