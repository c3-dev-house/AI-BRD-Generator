import { type NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { CONVERGENC3_TEMPLATE, hexToRgb, validateDiagrams } from "@/lib/convergenc3-template-config"
import { promises as fs } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] PDF Download: Starting request processing")

    const { brdContent, diagrams } = await request.json()

    console.log("[v0] PDF Download: Request parsed", {
      hasBrdContent: !!brdContent,
      brdContentLength: brdContent?.length || 0,
      diagramsCount: diagrams?.length || 0,
    })

    if (!brdContent || brdContent.trim() === "") {
      console.error("[v0] PDF Download Error: No BRD content provided")
      return NextResponse.json(
        {
          error: "No BRD content available. Please generate the BRD first before downloading.",
        },
        { status: 400 },
      )
    }

    const { valid: diagramsValid, savedDiagrams } = validateDiagrams(diagrams)
    console.log("[v0] Diagram validation result:", {
      valid: diagramsValid,
      savedDiagramsCount: savedDiagrams.length,
    })

    console.log("[v0] Generating Convergenc3 PDF using template config structure...")

    const cleanedContent = brdContent
      .replace(/Content-Type was not one of.*?[\r\n]/gi, "")
      .replace(/<automated_v0_instructions_reminder>[\s\S]*?<\/automated_v0_instructions_reminder>/gi, "")
      .replace(/\[v0\].*?[\r\n]/g, "")
      .replace(/console\.log.*?[\r\n]/g, "")
      .replace(/Error:.*?[\r\n]/gi, "")
      .replace(/Failed to.*?[\r\n]/gi, "")
      .replace(/\*\*\*\*/g, "")
      .replace(/```mermaid[\s\S]*?```/g, "[DIAGRAM_PLACEHOLDER]")
      .replace(/style\s+[A-Z]\s+fill:#[a-f0-9]{6}/gi, "")
      .replace(/```/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/!\[.*?\]$$.*?$$/g, "")
      .replace(/Page \d+ of \d+/gi, "")
      .trim()

    let projectName = CONVERGENC3_TEMPLATE.coverPage.title.text

    const h1Match = cleanedContent.match(/^#\s+(.+)$/m)
    if (h1Match && h1Match[1]) {
      const extracted = h1Match[1]
        .trim()
        .replace(/[#*_`]/g, "")
        .replace(/Business Requirements Document.*$/i, "")
        .replace(/$$BRD$$/gi, "")
        .trim()

      if (extracted.length >= 3 && extracted.length <= 100) {
        projectName = extracted
        console.log("[v0] PDF: Extracted project name from H1:", projectName)
      }
    }

    if (projectName === CONVERGENC3_TEMPLATE.coverPage.title.text) {
      const execSummaryMatch = cleanedContent.match(/##\s*Executive Summary\s*\n+([\s\S]{50,500}?)(?:\n##|\n\n)/i)
      if (execSummaryMatch && execSummaryMatch[1]) {
        const summaryText = execSummaryMatch[1].trim()
        const sentences = summaryText.split(/[.!?]/)
        for (const sentence of sentences.slice(0, 3)) {
          const projectMatches = [
            /(?:The|This)\s+([A-Z][A-Za-z\s&-]{5,50})\s+(?:project|system|platform|application)/i,
            /([A-Z][A-Za-z\s&-]{5,50})\s+is\s+(?:a|an|the)/i,
          ]

          for (const pattern of projectMatches) {
            const match = sentence.match(pattern)
            if (match && match[1]) {
              const extracted = match[1].trim()
              if (extracted.length >= 5 && extracted.length <= 60) {
                projectName = extracted
                console.log("[v0] PDF: Extracted project name from Executive Summary:", projectName)
                break
              }
            }
          }
          if (projectName !== CONVERGENC3_TEMPLATE.coverPage.title.text) break
        }
      }
    }

    console.log("[v0] PDF: Final project name for cover page:", projectName)

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = (CONVERGENC3_TEMPLATE.spacing.pageMargins.top / 1440) * 25.4
    const contentWidth = pageWidth - 2 * margin
    let currentY = margin

    let logoBase64: string | null = null
    try {
      const logoPath = path.join(process.cwd(), "assets", "convergenc3-logo.png")
      const logoBuffer = await fs.readFile(logoPath)
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`
      console.log("[v0] Loaded Convergenc3 logo from assets folder")
    } catch (err) {
      console.log("[v0] Failed to load logo:", err)
    }

    const diagramImagesBase64: string[] = []
    for (const diagram of savedDiagrams) {
      try {
        if (diagram.imageUrl) {
          const response = await fetch(diagram.imageUrl)
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString("base64")
            diagramImagesBase64.push(`data:image/png;base64,${base64}`)
            console.log("[v0] Loaded saved diagram for PDF")
          }
        }
      } catch (err) {
        console.error("[v0] Failed to load diagram:", err)
      }
    }

    const addPageNumber = (pageNum: number) => {
      doc.setFontSize(CONVERGENC3_TEMPLATE.pageNumbers.fontSize / 2)
      doc.setFont(CONVERGENC3_TEMPLATE.fonts.primary.toLowerCase().replace(" ", ""), "normal")
      doc.setTextColor(100, 100, 100)

      const position = CONVERGENC3_TEMPLATE.pageNumbers.position
      let xPos = pageWidth / 2
      if (position === "bottom-left") xPos = margin
      if (position === "bottom-right") xPos = pageWidth - margin

      doc.text(`${pageNum}`, xPos, pageHeight - 10, {
        align: position === "bottom-left" ? "left" : position === "bottom-right" ? "right" : "center",
      })
      doc.setTextColor(0, 0, 0)
    }

    const addNewPage = () => {
      doc.addPage()
      currentY = margin
    }

    const checkPageBreak = (requiredSpace: number) => {
      if (currentY + requiredSpace > pageHeight - 30) {
        addNewPage()
      }
    }

    doc.setFontSize(CONVERGENC3_TEMPLATE.coverPage.header.fontSize)
    doc.setFont(CONVERGENC3_TEMPLATE.fonts.primary.toLowerCase().replace(" ", ""), "normal")

    const headerAlignment = CONVERGENC3_TEMPLATE.coverPage.header.alignment
    const headerX =
      headerAlignment === "right" ? pageWidth - margin : headerAlignment === "left" ? margin : pageWidth / 2

    doc.text(CONVERGENC3_TEMPLATE.coverPage.header.controlDisclosure, headerX, 20, {
      align: headerAlignment,
    })
    doc.text(CONVERGENC3_TEMPLATE.coverPage.header.version, headerX, 25, {
      align: headerAlignment,
    })

    if (logoBase64) {
      try {
        const logoWidth = (CONVERGENC3_TEMPLATE.coverPage.logo.width / 1440) * 25.4
        const logoHeight = (CONVERGENC3_TEMPLATE.coverPage.logo.height / 1440) * 25.4

        let logoX = (pageWidth - logoWidth) / 2
        if (CONVERGENC3_TEMPLATE.coverPage.logo.alignment === "left") logoX = margin
        if (CONVERGENC3_TEMPLATE.coverPage.logo.alignment === "right") logoX = pageWidth - margin - logoWidth

        const logoY = 20 + (CONVERGENC3_TEMPLATE.coverPage.header.spacing.afterHeader / 1440) * 25.4

        doc.addImage(logoBase64, "PNG", logoX, logoY, logoWidth, logoHeight)
        currentY = logoY + logoHeight + (CONVERGENC3_TEMPLATE.coverPage.logo.spacingAfter / 1440) * 25.4
      } catch (err) {
        console.error("[v0] Failed to add logo:", err)
        currentY = margin + 50
      }
    } else {
      currentY = margin + 50
    }

    doc.setFontSize(CONVERGENC3_TEMPLATE.coverPage.title.fontSize)
    doc.setFont(
      CONVERGENC3_TEMPLATE.fonts.primary.toLowerCase().replace(" ", ""),
      CONVERGENC3_TEMPLATE.coverPage.title.bold ? "bold" : "normal",
    )
    const primaryRgb = hexToRgb(CONVERGENC3_TEMPLATE.colors.primary)
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)

    let titleX = pageWidth / 2
    if (CONVERGENC3_TEMPLATE.coverPage.title.alignment === "left") titleX = margin
    if (CONVERGENC3_TEMPLATE.coverPage.title.alignment === "right") titleX = pageWidth - margin

    doc.text(projectName, titleX, currentY, {
      align: CONVERGENC3_TEMPLATE.coverPage.title.alignment,
    })
    currentY += (CONVERGENC3_TEMPLATE.coverPage.title.spacingAfter / 1440) * 25.4

    doc.setFontSize(CONVERGENC3_TEMPLATE.coverPage.subtitle.fontSize)
    doc.setFont(
      CONVERGENC3_TEMPLATE.fonts.primary.toLowerCase().replace(" ", ""),
      CONVERGENC3_TEMPLATE.coverPage.subtitle.bold ? "bold" : "normal",
    )
    doc.setTextColor(51, 51, 51)

    let subtitleX = pageWidth / 2
    if (CONVERGENC3_TEMPLATE.coverPage.subtitle.alignment === "left") subtitleX = margin
    if (CONVERGENC3_TEMPLATE.coverPage.subtitle.alignment === "right") subtitleX = pageWidth - margin

    doc.text(CONVERGENC3_TEMPLATE.coverPage.subtitle.text, subtitleX, currentY, {
      align: CONVERGENC3_TEMPLATE.coverPage.subtitle.alignment,
    })

    addNewPage()

    doc.setFontSize(CONVERGENC3_TEMPLATE.fonts.size.h1)
    doc.setFont(CONVERGENC3_TEMPLATE.fonts.headings.toLowerCase().replace(" ", ""), "bold")
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    doc.text("Table of Contents", margin, currentY)
    currentY += 15

    doc.setFontSize(CONVERGENC3_TEMPLATE.fonts.size.body)
    doc.setFont(CONVERGENC3_TEMPLATE.fonts.body.toLowerCase().replace(" ", ""), "normal")
    doc.setTextColor(51, 51, 51)

    const lines = cleanedContent.split("\n")
    let sectionNumber = 1
    const tocEntries: { title: string; level: number; page: number }[] = []

    for (const line of lines) {
      if (line.startsWith("## ")) {
        const title = line.substring(3).replace(/[#*_]/g, "").trim()
        tocEntries.push({ title: `${sectionNumber}. ${title}`, level: 1, page: sectionNumber + 2 })
        sectionNumber++
      }
    }

    for (const entry of tocEntries.slice(0, 15)) {
      doc.text(`${entry.title}`, margin + 5, currentY)
      doc.text(`${entry.page}`, pageWidth - margin - 10, currentY, { align: "right" })
      currentY += 7
      if (currentY > pageHeight - 40) break
    }

    addNewPage()
    doc.setTextColor(0, 0, 0)

    let inTable = false
    let tableData: string[][] = []
    let diagramIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (!line || line.startsWith("style ") || line.match(/^[A-Z]\s+fill:/) || line.startsWith("```")) {
        continue
      }

      if (line === "[DIAGRAM_PLACEHOLDER]") {
        if (diagramIndex < diagramImagesBase64.length && diagramImagesBase64[diagramIndex]) {
          try {
            checkPageBreak(120)
            const imgData = diagramImagesBase64[diagramIndex]
            const imgWidth = 160
            const imgHeight = 100
            const imgX = (pageWidth - imgWidth) / 2

            doc.addImage(imgData, "PNG", imgX, currentY, imgWidth, imgHeight)
            currentY += imgHeight + 10
            console.log("[v0] PDF: Embedded diagram", diagramIndex + 1)
          } catch (err) {
            console.error("[v0] PDF: Failed to embed diagram:", err)
          }
        }
        diagramIndex++
        continue
      }

      if (line.startsWith("|") && line.endsWith("|")) {
        if (!inTable) {
          inTable = true
          tableData = []
        }

        const cells = line
          .split("|")
          .map((cell) => cell.trim().replace(/[*_]/g, ""))
          .filter((cell) => cell !== "" && !cell.match(/^-+$/))

        if (cells.length > 0 && !cells.every((cell) => cell.match(/^-+$/))) {
          tableData.push(cells)
        }

        const nextLine = lines[i + 1]?.trim() || ""
        if (!nextLine.startsWith("|") || !nextLine.endsWith("|")) {
          if (tableData.length > 1) {
            checkPageBreak(50)

            const headers = tableData[0]
            const body = tableData.slice(1)

            const headerRgb = hexToRgb(CONVERGENC3_TEMPLATE.tables.headerBackgroundColor)
            const borderRgb = hexToRgb(CONVERGENC3_TEMPLATE.tables.borderColor)
            const altRowRgb = hexToRgb(CONVERGENC3_TEMPLATE.tables.alternateRowColor)

            autoTable(doc, {
              startY: currentY,
              head: [headers],
              body: body,
              theme: "grid",
              styles: {
                font: CONVERGENC3_TEMPLATE.fonts.body.toLowerCase().replace(" ", ""),
                fontSize: CONVERGENC3_TEMPLATE.fonts.size.body,
                cellPadding: CONVERGENC3_TEMPLATE.tables.cellPadding / 50,
                lineColor: [borderRgb.r, borderRgb.g, borderRgb.b],
                lineWidth: CONVERGENC3_TEMPLATE.tables.borderWidth / 20,
              },
              headStyles: {
                fillColor: [headerRgb.r, headerRgb.g, headerRgb.b],
                textColor: hexToRgb(CONVERGENC3_TEMPLATE.tables.headerTextColor),
                fontStyle: "bold",
                fontSize: CONVERGENC3_TEMPLATE.fonts.size.small,
                halign: "center",
              },
              bodyStyles: {
                fontSize: CONVERGENC3_TEMPLATE.fonts.size.body,
                textColor: hexToRgb(CONVERGENC3_TEMPLATE.colors.text),
              },
              alternateRowStyles: {
                fillColor: [altRowRgb.r, altRowRgb.g, altRowRgb.b],
              },
              margin: { left: margin, right: margin },
              tableWidth: contentWidth,
            })

            currentY = (doc as any).lastAutoTable.finalY + 8
          }
          inTable = false
          tableData = []
        }
        continue
      }

      if (line.startsWith("# ")) {
        checkPageBreak(20)
        doc.setFontSize(CONVERGENC3_TEMPLATE.fonts.size.title)
        doc.setFont(CONVERGENC3_TEMPLATE.fonts.headings.toLowerCase().replace(" ", ""), "bold")
        doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        const title = line.substring(2).replace(/[*_]/g, "")
        doc.text(title, pageWidth / 2, currentY, { align: "center" })
        currentY += 10

        doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        doc.setLineWidth(0.5)
        doc.line(margin + 20, currentY, pageWidth - margin - 20, currentY)
        currentY += 8
        doc.setTextColor(0, 0, 0)
      } else if (line.startsWith("## ")) {
        checkPageBreak(15)
        currentY += 4
        doc.setFontSize(CONVERGENC3_TEMPLATE.fonts.size.h1)
        doc.setFont(CONVERGENC3_TEMPLATE.fonts.headings.toLowerCase().replace(" ", ""), "bold")
        doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        const text = line.substring(3).replace(/[*_]/g, "")
        doc.text(text, margin, currentY)
        currentY += 8
        doc.setTextColor(0, 0, 0)
      } else if (line.startsWith("### ")) {
        checkPageBreak(12)
        currentY += 3
        doc.setFontSize(CONVERGENC3_TEMPLATE.fonts.size.h2)
        doc.setFont(CONVERGENC3_TEMPLATE.fonts.headings.toLowerCase().replace(" ", ""), "bold")
        const headingRgb = hexToRgb(CONVERGENC3_TEMPLATE.colors.heading)
        doc.setTextColor(headingRgb.r, headingRgb.g, headingRgb.b)
        const text = line.substring(4).replace(/[*_]/g, "")
        doc.text(text, margin, currentY)
        currentY += 7
        doc.setTextColor(0, 0, 0)
      } else if (line.startsWith("#### ")) {
        checkPageBreak(10)
        currentY += 2
        doc.setFontSize(CONVERGENC3_TEMPLATE.fonts.size.h3)
        doc.setFont(CONVERGENC3_TEMPLATE.fonts.headings.toLowerCase().replace(" ", ""), "bold")
        const textRgb = hexToRgb(CONVERGENC3_TEMPLATE.colors.text)
        doc.setTextColor(textRgb.r, textRgb.g, textRgb.b)
        const text = line.substring(5).replace(/[*_]/g, "")
        doc.text(text, margin, currentY)
        currentY += 6
        doc.setTextColor(0, 0, 0)
      } else if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
        checkPageBreak(8)
        doc.setFontSize(CONVERGENC3_TEMPLATE.fonts.size.body)
        doc.setFont(CONVERGENC3_TEMPLATE.fonts.body.toLowerCase().replace(" ", ""), "normal")
        const textRgb = hexToRgb(CONVERGENC3_TEMPLATE.colors.text)
        doc.setTextColor(textRgb.r, textRgb.g, textRgb.b)

        const text = line.replace(/^[-*•]\s+/, "").replace(/[*_]/g, "")

        doc.circle(margin + 2, currentY - 1, 0.7, "F")
        const splitLines = doc.splitTextToSize(text, contentWidth - 6)
        doc.text(splitLines, margin + 6, currentY)
        currentY += splitLines.length * 5 + 2
        doc.setTextColor(0, 0, 0)
      } else if (line === "---") {
        checkPageBreak(5)
        currentY += 3
        const borderRgb = hexToRgb(CONVERGENC3_TEMPLATE.colors.tableBorder)
        doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b)
        doc.setLineWidth(0.3)
        doc.line(margin, currentY, pageWidth - margin, currentY)
        currentY += 5
      } else if (line.length > 0) {
        checkPageBreak(8)
        doc.setFontSize(CONVERGENC3_TEMPLATE.fonts.size.body)
        doc.setFont(CONVERGENC3_TEMPLATE.fonts.body.toLowerCase().replace(" ", ""), "normal")

        const cleanLine = line.replace(/[*_]/g, "")
        const splitLines = doc.splitTextToSize(cleanLine, contentWidth)
        doc.text(splitLines, margin, currentY)
        currentY += splitLines.length * 5 + 2
        doc.setTextColor(0, 0, 0)
      }
    }

    const totalPages = doc.getNumberOfPages()
    for (let i = CONVERGENC3_TEMPLATE.pageNumbers.startPage; i <= totalPages; i++) {
      doc.setPage(i)
      addPageNumber(i)
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    console.log("[v0] PDF generated using CONVERGENC3_TEMPLATE structure")

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="BRD_Convergenc3.pdf"',
      },
    })
  } catch (error) {
    console.error("[v0] PDF generation error:", error)
    if (error instanceof Error) {
      console.error("[v0] Error details:", {
        message: error.message,
        stack: error.stack,
      })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 },
    )
  }
}
