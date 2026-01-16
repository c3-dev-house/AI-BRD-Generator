import { type NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"

async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase()

  console.log(`[v0] Extracting ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB`)

  // For text-based files, read directly
  if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
    const text = await file.text()
    console.log(`[v0] TXT extracted: ${text.length} characters`)
    return text
  }

  // For JSON files
  if (fileName.endsWith(".json")) {
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      return JSON.stringify(json, null, 2)
    } catch {
      return await file.text()
    }
  }

  // For PDF files
  if (fileName.endsWith(".pdf")) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      console.log(`[v0] Loading PDF with ${uint8Array.length} bytes`)

      // Mock canvas for server-side rendering
      if (typeof document === "undefined") {
        global.document = {
          createElement: () => ({
            getContext: () => null,
          }),
        } as any
      }

      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")

      // Disable worker for server-side
      pdfjsLib.GlobalWorkerOptions.workerSrc = ""

      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useSystemFonts: true,
        standardFontDataUrl: null,
      })
      const pdf = await loadingTask.promise

      let fullText = ""
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(" ")
        fullText += pageText + "\n\n"
      }

      console.log(`[v0] PDF extracted: ${fullText.length} characters from ${pdf.numPages} pages`)

      if (fullText.trim()) {
        return fullText
      } else {
        throw new Error("PDF appears to be empty or contains no text")
      }
    } catch (error) {
      console.error("[v0] PDF extraction error:", error)
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // For CSV files
  if (fileName.endsWith(".csv")) {
    try {
      const text = await file.text()
      console.log(`[v0] CSV extracted: ${text.length} characters`)
      return text
    } catch (error) {
      console.error("[v0] CSV extraction error:", error)
      throw new Error(`CSV extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // For Excel files
  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      console.log(`[v0] Loading Excel with ${arrayBuffer.byteLength} bytes`)

      const xlsx = await import("xlsx")
      const workbook = xlsx.read(arrayBuffer, { type: "array" })
      let fullText = ""

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName]
        const sheetText = xlsx.utils.sheet_to_text(worksheet)
        if (sheetText) {
          fullText += sheetText + "\n\n"
        }
      })

      console.log(`[v0] Excel extracted: ${fullText.length} characters from ${workbook.SheetNames.length} sheets`)

      if (fullText.trim()) {
        return fullText
      } else {
        throw new Error("Excel appears to be empty or contains no text")
      }
    } catch (error) {
      console.error("[v0] Excel extraction error:", error)
      throw new Error(`Excel extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // For DOCX files
  if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      console.log(`[v0] Loading DOCX with ${buffer.length} bytes`)

      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer })

      console.log(`[v0] DOCX extracted: ${result.value.length} characters`)

      if (result.value && result.value.trim()) {
        return result.value
      } else {
        throw new Error("DOCX appears to be empty or contains no text")
      }
    } catch (error) {
      console.error("[v0] DOCX extraction error:", error)
      throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // For PowerPoint files
  if (fileName.endsWith(".pptx") || fileName.endsWith(".ppt")) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      console.log(`[v0] Loading PPTX with ${arrayBuffer.byteLength} bytes`)

      const PizZip = (await import("pizzip")).default
      const zip = new PizZip(arrayBuffer)
      let fullText = ""

      // Extract text from slides
      const slideFiles = Object.keys(zip.files).filter((name) => name.match(/ppt\/slides\/slide\d+\.xml/))
      console.log(`[v0] Found ${slideFiles.length} slides in PowerPoint`)

      for (const slideFile of slideFiles) {
        const content = zip.files[slideFile].asText()
        const text = content
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        if (text) {
          fullText += text + "\n\n"
        }
      }

      console.log(`[v0] PPTX extracted: ${fullText.length} characters`)

      if (fullText.trim()) {
        return fullText
      } else {
        throw new Error("PowerPoint appears to be empty or contains no text")
      }
    } catch (error) {
      console.error("[v0] PowerPoint extraction error:", error)
      throw new Error(`PowerPoint extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Fallback: try to read as text
  try {
    const text = await file.text()
    if (text && text.trim()) {
      console.log(`[v0] Generic text extraction: ${text.length} characters`)
      return text
    }
  } catch (error) {
    console.error("[v0] Generic text extraction failed:", error)
  }

  throw new Error(`Unable to extract text from ${file.name}. The file may be empty or in an unsupported format.`)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const files: File[] = []
    for (let i = 0; i < 5; i++) {
      const file = formData.get(`file${i}`) as File | null
      if (file) files.push(file)
    }

    // Support single file upload for backward compatibility
    const singleFile = formData.get("file") as File | null
    if (singleFile && files.length === 0) {
      files.push(singleFile)
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    console.log(`[v0] Received ${files.length} file(s) for processing`)

    // Validate file sizes (10MB per file, 50MB total)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Total file size exceeds 50MB limit" }, { status: 400 })
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} exceeds 10MB limit` }, { status: 400 })
      }
    }

    // Validate file types
    const allowedExtensions = [
      ".pdf",
      ".docx",
      ".doc",
      ".txt",
      ".md",
      ".csv",
      ".json",
      ".xlsx",
      ".xls",
      ".pptx",
      ".ppt",
    ]

    for (const file of files) {
      const fileName = file.name.toLowerCase()
      const isValidType = allowedExtensions.some((ext) => fileName.endsWith(ext))

      if (!isValidType) {
        return NextResponse.json(
          {
            error: `Invalid file type for ${file.name}. Supported formats: PDF, DOCX, DOC, TXT, MD, CSV, JSON, XLSX, XLS, PPTX, PPT`,
          },
          { status: 400 },
        )
      }
    }

    const extractionResults = await Promise.all(
      files.map(async (file) => {
        try {
          const text = await extractTextFromFile(file)
          return {
            fileName: file.name,
            text,
            success: true,
            fileSize: file.size,
            extractedLength: text.length,
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown extraction error"
          console.error(`[v0] Failed to extract ${file.name}:`, errorMessage)
          return {
            fileName: file.name,
            text: "",
            success: false,
            error: errorMessage,
            fileSize: file.size,
            extractedLength: 0,
          }
        }
      }),
    )

    const successfulExtractions = extractionResults.filter((r) => r.success)
    const successCount = successfulExtractions.length

    if (successCount === 0) {
      console.error("[v0] No files could be extracted")
      return NextResponse.json(
        {
          error: "Could not extract text from any files",
          results: extractionResults.map((r) => ({ fileName: r.fileName, error: r.error })),
        },
        { status: 400 },
      )
    }

    const combinedText = successfulExtractions
      .map((result) => {
        const separator = "=".repeat(80)
        return `${separator}\nFILE: ${result.fileName}\nSIZE: ${(result.fileSize / 1024).toFixed(2)} KB\nEXTRACTED: ${result.extractedLength} characters\n${separator}\n\n${result.text}`
      })
      .join("\n\n\n")

    console.log(
      `[v0] Upload successful: ${successCount}/${files.length} files processed, ${combinedText.length} total characters extracted`,
    )
    console.log(`[v0] Preview of extracted text (first 500 chars):\n${combinedText.substring(0, 500)}...`)

    return NextResponse.json({
      success: true,
      extractedText: combinedText,
      fileCount: files.length,
      successCount,
      fileNames: files.map((f) => f.name),
      totalFileSize: totalSize,
      extractedLength: combinedText.length,
      extractionResults: extractionResults.map(({ fileName, success, error, fileSize, extractedLength }) => ({
        fileName,
        success,
        error,
        fileSize,
        extractedLength,
      })),
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process files" },
      { status: 500 },
    )
  }
}
