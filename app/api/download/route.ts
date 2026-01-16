import { type NextRequest, NextResponse } from "next/server"
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Packer,
  ImageRun,
  TableOfContents,
  PageNumber,
  Footer,
} from "docx"
import { CONVERGENC3_TEMPLATE, validateDiagrams } from "@/lib/convergenc3-template-config"
import { promises as fs } from "fs"
import path from "path"

async function convertMermaidToImage(mermaidCode: string): Promise<Buffer | null> {
  try {
    const cleanCode = mermaidCode
      .replace(/```mermaid/g, "")
      .replace(/```/g, "")
      .trim()

    if (!cleanCode || cleanCode.length < 10) {
      console.error("[v0] Invalid Mermaid code (too short)")
      return null
    }

    const encoded = Buffer.from(cleanCode).toString("base64")
    const imageUrl = `https://mermaid.ink/img/${encoded}`

    console.log("[v0] Fetching diagram from mermaid.ink as PNG...")

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "BRD-Generator/1.0",
        Accept: "image/png",
      },
    })

    if (!response.ok) {
      console.error("[v0] Mermaid.ink returned error:", response.status, response.statusText)
      return null
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("image")) {
      console.error("[v0] Response is not an image, got:", contentType)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length === 0) {
      console.error("[v0] Received empty image buffer")
      return null
    }

    console.log(`[v0] Successfully fetched diagram image (${buffer.length} bytes)`)
    return buffer
  } catch (error) {
    console.error("[v0] Error converting Mermaid to image:", error)
    return null
  }
}

async function embedMermaidDiagrams(content: string): Promise<string> {
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
  let processedContent = content
  let match
  let diagramIndex = 0

  const matches: Array<{ index: number; code: string; fullMatch: string }> = []

  // Find all Mermaid blocks
  while ((match = mermaidRegex.exec(content)) !== null) {
    matches.push({
      index: diagramIndex++,
      code: match[1],
      fullMatch: match[0],
    })
  }

  console.log(`[v0] Found ${matches.length} Mermaid diagrams to process`)

  // Process each diagram
  for (const match of matches) {
    const imageBuffer = await convertMermaidToImage(match.code)

    if (imageBuffer) {
      // Store the image buffer for later use
      const diagramKey = `DIAGRAM_${match.index}`
      diagramImages.set(diagramKey, imageBuffer)

      // Replace Mermaid code with marker
      processedContent = processedContent.replace(match.fullMatch, `[${diagramKey}]`)
      console.log(`[v0] Processed diagram ${match.index} successfully`)
    } else {
      console.warn(`[v0] Failed to process diagram ${match.index}, keeping as code`)
    }
  }

  return processedContent
}

const diagramImages = new Map<string, Buffer>()

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] DOCX Download: Starting request processing")

    const { brdContent, diagrams } = await request.json()

    console.log("[v0] DOCX Download: Request parsed", {
      hasBrdContent: !!brdContent,
      brdContentLength: brdContent?.length || 0,
      brdContentPreview: brdContent?.substring(0, 200) || "EMPTY",
      diagramsCount: diagrams?.length || 0,
    })

    if (!brdContent || brdContent.trim() === "") {
      console.error("[v0] DOCX Download Error: No BRD content provided")
      return NextResponse.json(
        {
          error: "No BRD content available. Please generate the BRD first before downloading.",
        },
        { status: 400 },
      )
    }

    console.log("[v0] DOCX Download Request:", {
      brdContentLength: brdContent.length,
      diagramsCount: diagrams?.length || 0,
    })

    const processedContent = await embedMermaidDiagrams(brdContent)
    console.log("[v0] Processed content with embedded diagram markers")

    const { valid: diagramsValid, savedDiagrams } = validateDiagrams(diagrams)
    console.log("[v0] Diagram validation result:", {
      valid: diagramsValid,
      savedDiagramsCount: savedDiagrams.length,
    })

    console.log("[v0] Generating Convergenc3 BRD DOCX with exact template formatting...")

    console.log("[v0] BRD Content preview (first 500 chars):", processedContent.substring(0, 500))

    let projectName = "Project Name"

    // Try multiple patterns to extract project name
    const titlePatterns = [
      /^#\s+(.+)$/m, // Standard markdown H1
      /^\*\*Project Name[:\s]*\*\*\s*(.+)$/m, // Bold label format
      /^Project Name[:\s]+(.+)$/m, // Plain label format
      /Business Requirements Document[\s\S]*?for\s+(.+?)(?:\n|\.)/i, // Extract from "for Project Name"
      /^The\s+(.+?)\s+project/im, // "The [Project Name] project"
    ]

    for (const pattern of titlePatterns) {
      const match = processedContent.match(pattern)
      if (match && match[1]) {
        let extracted = match[1].trim()

        // Clean up and limit to short project name only
        extracted = extracted
          .replace(/[#*_`]/g, "") // Remove markdown formatting
          .split(/[,.$$$$\n]/)[0] // Stop at punctuation or newline
          .trim()

        // Take only first 6 words maximum for short name
        const words = extracted.split(/\s+/)
        if (words.length > 6) {
          extracted = words.slice(0, 6).join(" ")
        }

        // Only accept if it's reasonable length (5-60 chars)
        if (extracted.length >= 5 && extracted.length <= 60) {
          projectName = extracted
          console.log("[v0] Extracted project name using pattern:", pattern, "=>", projectName)
          break
        }
      }
    }

    // If still no match, try to find project name in the first few lines
    if (projectName === "Project Name") {
      const firstLines = processedContent.split("\n").slice(0, 20)
      for (const line of firstLines) {
        if (line.toLowerCase().includes("project") && !line.toLowerCase().includes("business requirements")) {
          let cleaned = line.replace(/[#*_\-:]/g, "").trim()

          // Stop at first sentence or punctuation
          cleaned = cleaned.split(/[,.;$$$$]/)[0].trim()

          // Take only first 6 words for short name
          const words = cleaned.split(/\s+/)
          if (words.length > 6) {
            cleaned = words.slice(0, 6).join(" ")
          }

          if (cleaned.length >= 5 && cleaned.length <= 60) {
            projectName = cleaned
            console.log("[v0] Extracted project name from early lines:", projectName)
            break
          }
        }
      }
    }

    console.log("[v0] Final extracted project name:", projectName)

    const cleanedContent = processedContent
      .replace(/```mermaid[\s\S]*?```/g, "[DIAGRAM_PLACEHOLDER]")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/style\s+[A-Z]\s+fill:#[a-f0-9]{6}/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/!\[.*?\]$$.*?$$/g, "")
      .replace(/Page\s+\d+\s+of\s+\d+/gi, "")
      .replace(/\[Version \d+\.\d+\]/gi, "")
      .replace(/\[Control Disclosure\]/gi, "")

    const lines = cleanedContent.split("\n")
    const docChildren: (Paragraph | Table | TableOfContents)[] = []

    let logoImage: Buffer | null = null
    try {
      const logoPath = path.join(process.cwd(), "assets", "convergenc3-logo.png")
      logoImage = await fs.readFile(logoPath)
      console.log("[v0] Loaded Convergenc3 logo from assets folder for cover page")
    } catch (err) {
      console.log("[v0] Failed to load Convergenc3 logo from assets folder:", err)
    }

    // Add "Control Disclosure" and version in header area (top right)
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Control Disclosure",
            size: 18,
            font: CONVERGENC3_TEMPLATE.fonts.primary,
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 400, after: 100 },
      }),
    )

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "[Version 0.1]",
            size: 18,
            font: CONVERGENC3_TEMPLATE.fonts.primary,
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 1400 },
      }),
    )

    if (logoImage) {
      docChildren.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: logoImage,
              transformation: {
                width: 285, // Exact size from uploaded logo
                height: 285, // Exact size from uploaded logo
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 1800, after: 1200 },
        }),
      )
    }

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: projectName,
            size: 48,
            bold: true,
            font: CONVERGENC3_TEMPLATE.fonts.primary,
            color: CONVERGENC3_TEMPLATE.colors.primary,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    )

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Business Requirements Document",
            size: 32,
            bold: true,
            font: CONVERGENC3_TEMPLATE.fonts.primary,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    )

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "(BRD)",
            size: 28,
            bold: true,
            font: CONVERGENC3_TEMPLATE.fonts.primary,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    )

    docChildren.push(
      new Paragraph({
        text: "",
        pageBreakBefore: true,
      }),
    )

    const execSummaryMatch = processedContent.match(
      /##\s*Executive Summary\s*\n([\s\S]*?)(?=\n##|\n\*\*Table of Contents|z)/i,
    )
    if (execSummaryMatch) {
      docChildren.push(
        new Paragraph({
          text: "Executive Summary",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 300 },
        }),
      )

      const execSummaryText = execSummaryMatch[1].trim()
      const execSummaryParas = execSummaryText.split("\n\n")

      execSummaryParas.forEach((para) => {
        if (para.trim()) {
          docChildren.push(
            new Paragraph({
              children: parseInlineMarkdown(para.trim()),
              spacing: {
                before: CONVERGENC3_TEMPLATE.spacing.paragraphBefore,
                after: CONVERGENC3_TEMPLATE.spacing.paragraphAfter,
              },
            }),
          )
        }
      })
    }

    docChildren.push(
      new Paragraph({
        text: "",
        pageBreakBefore: true,
      }),
    )

    docChildren.push(
      new Paragraph({
        text: "Table of Contents",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 },
      }),
    )

    docChildren.push(
      new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3",
      }),
    )

    docChildren.push(
      new Paragraph({
        text: "",
        pageBreakBefore: true,
      }),
    )

    let diagramIndex = 0
    let i = 0
    let skipExecutiveSummary = false

    while (i < lines.length) {
      const line = lines[i].trim()

      if (!line || line.startsWith("style ") || line.match(/^[A-Z]\s+fill:/) || line.match(/^Page\s+\d+/)) {
        i++
        continue
      }

      if (line.match(/^##\s*Executive Summary/i)) {
        skipExecutiveSummary = true
        i++
        continue
      }

      // Stop skipping when we hit the next section
      if (skipExecutiveSummary && line.match(/^##\s*/)) {
        skipExecutiveSummary = false
      }

      if (skipExecutiveSummary) {
        i++
        continue
      }

      if (line.match(/^##?\s*Table of Contents/i) || line.match(/^\*\*Table of Contents\*\*/i)) {
        i++
        continue
      }

      if (line === "[DIAGRAM_PLACEHOLDER]") {
        const diagramKey = `DIAGRAM_${diagramIndex}`
        const imageBuffer = diagramImages.get(diagramKey)
        if (imageBuffer && imageBuffer.length > 0) {
          try {
            docChildren.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: {
                      width: 600,
                      height: 400,
                    },
                  }),
                ],
                spacing: { before: 300, after: 300 },
                alignment: AlignmentType.CENTER,
              }),
            )
          } catch (err) {
            console.error("[v0] Failed to embed diagram:", err)
          }
        }
        diagramIndex++
        i++
        continue
      }

      if (line.match(/^\[DIAGRAM_\d+\]$/)) {
        const diagramKey = line.replace(/[[\]]/g, "")
        const imageBuffer = diagramImages.get(diagramKey)

        if (imageBuffer) {
          try {
            docChildren.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: {
                      width: 600,
                      height: 400,
                    },
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              }),
            )
            console.log(`[v0] Embedded diagram: ${diagramKey}`)
          } catch (error) {
            console.error(`[v0] Error embedding diagram ${diagramKey}:`, error)
            docChildren.push(
              new Paragraph({
                text: `[Diagram could not be rendered: ${diagramKey}]`,
                italics: true,
                spacing: { before: 200, after: 200 },
              }),
            )
          }
        }
      } else if (line.startsWith("|") && line.endsWith("|")) {
        const tableLines: string[] = []

        while (i < lines.length && lines[i].trim().startsWith("|")) {
          tableLines.push(lines[i])
          i++
        }

        if (tableLines.length >= 2) {
          const table = parseMarkdownTableWithGrids(tableLines)
          if (table) {
            docChildren.push(table)
            docChildren.push(new Paragraph({ text: "", spacing: { before: 200, after: 200 } }))
          }
        }
        continue
      }

      if (line.startsWith("# ")) {
        docChildren.push(
          new Paragraph({
            text: cleanText(line.substring(2)),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 300 },
            pageBreakBefore: true,
          }),
        )
      } else if (line.startsWith("## ")) {
        const headingText = cleanText(line.substring(3))
        const shouldBreak =
          headingText.toLowerCase().includes("business problem") ||
          headingText.toLowerCase().includes("business requirements") ||
          headingText.toLowerCase().includes("objectives") ||
          headingText.toLowerCase().includes("scope") ||
          headingText.toLowerCase().includes("assumptions") ||
          headingText.toLowerCase().includes("stakeholders") ||
          headingText.toLowerCase().includes("current state") ||
          headingText.toLowerCase().includes("future state") ||
          headingText.toLowerCase().includes("user story") ||
          headingText.toLowerCase().includes("appendix") ||
          headingText.match(/^(us|a)\d+/i) || // User story IDs like US A1, A2, etc.
          headingText.match(/^\d+\s/) // Numbered sections like "1 Governance", "5 Business Problem"

        docChildren.push(
          new Paragraph({
            text: headingText,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            pageBreakBefore: shouldBreak,
          }),
        )
      } else if (line.startsWith("### ")) {
        docChildren.push(
          new Paragraph({
            text: cleanText(line.substring(4)),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 250, after: 120 },
          }),
        )
      } else if (line.startsWith("#### ")) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(line.substring(5)),
                bold: true,
                size: CONVERGENC3_TEMPLATE.fonts.size.h4 * 2,
                font: CONVERGENC3_TEMPLATE.fonts.primary,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
        )
      } else if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
        const bulletText = line.substring(2).trim()
        docChildren.push(
          new Paragraph({
            children: parseInlineMarkdown(bulletText),
            bullet: { level: 0 },
            spacing: { before: 80, after: 80 },
            indent: { left: 360 },
          }),
        )
      } else if (line.trim() === "---") {
        docChildren.push(
          new Paragraph({
            border: {
              bottom: {
                color: "CCCCCC",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            spacing: { before: 150, after: 150 },
          }),
        )
      } else if (line.trim() !== "") {
        const textRuns = parseInlineMarkdown(line)
        docChildren.push(
          new Paragraph({
            children: textRuns,
            spacing: {
              before: CONVERGENC3_TEMPLATE.spacing.paragraphBefore,
              after: CONVERGENC3_TEMPLATE.spacing.paragraphAfter,
            },
          }),
        )
      } else {
        docChildren.push(new Paragraph({ text: "" }))
      }

      i++
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: CONVERGENC3_TEMPLATE.spacing.pageMargins.top,
                right: CONVERGENC3_TEMPLATE.spacing.pageMargins.right,
                bottom: CONVERGENC3_TEMPLATE.spacing.pageMargins.bottom,
                left: CONVERGENC3_TEMPLATE.spacing.pageMargins.left,
              },
            },
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: CONVERGENC3_TEMPLATE.fonts.primary,
                      size: CONVERGENC3_TEMPLATE.pageNumbers.fontSize,
                    }),
                  ],
                }),
              ],
            }),
          },
          children: docChildren,
        },
      ],
      styles: {
        default: {
          document: {
            run: {
              font: CONVERGENC3_TEMPLATE.fonts.body,
              size: CONVERGENC3_TEMPLATE.fonts.size.body * 2, // Convert to half-points
            },
          },
        },
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: CONVERGENC3_TEMPLATE.fonts.body,
              size: CONVERGENC3_TEMPLATE.fonts.size.body * 2,
            },
            paragraph: {
              spacing: {
                line: CONVERGENC3_TEMPLATE.spacing.lineHeight,
                before: CONVERGENC3_TEMPLATE.spacing.paragraphBefore,
                after: CONVERGENC3_TEMPLATE.spacing.paragraphAfter,
              },
            },
          },
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: CONVERGENC3_TEMPLATE.fonts.headings,
              size: CONVERGENC3_TEMPLATE.fonts.size.h1 * 2,
              bold: true,
              color: CONVERGENC3_TEMPLATE.colors.primary,
            },
            paragraph: {
              spacing: { before: 400, after: 300 },
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: CONVERGENC3_TEMPLATE.fonts.headings,
              size: CONVERGENC3_TEMPLATE.fonts.size.h2 * 2,
              bold: true,
              color: CONVERGENC3_TEMPLATE.colors.heading,
            },
            paragraph: {
              spacing: { before: 300, after: 200 },
            },
          },
          {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: CONVERGENC3_TEMPLATE.fonts.headings,
              size: CONVERGENC3_TEMPLATE.fonts.size.h3 * 2,
              bold: true,
              color: CONVERGENC3_TEMPLATE.colors.text,
            },
            paragraph: {
              spacing: { before: 250, after: 150 },
            },
          },
        ],
      },
    })

    const docxBuffer = await Packer.toBuffer(doc)

    console.log("[v0] Convergenc3 BRD DOCX generated with exact template specifications")

    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="BRD_Convergenc3.docx"',
      },
    })
  } catch (error) {
    console.error("[v0] DOCX generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate DOCX" },
      { status: 500 },
    )
  }
}

function parseMarkdownTableWithGrids(tableLines: string[]): Table | null {
  if (tableLines.length < 2) return null

  const headerCells = tableLines[0]
    .split("|")
    .map((cell) => cleanText(cell))
    .filter((cell) => cell !== "")

  const dataRows = tableLines.slice(2).map((line) =>
    line
      .split("|")
      .map((cell) => cleanText(cell))
      .filter((cell) => cell !== ""),
  )

  const rows: TableRow[] = []

  rows.push(
    new TableRow({
      children: headerCells.map(
        (cell) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cell,
                    bold: true,
                    color: CONVERGENC3_TEMPLATE.tables.headerTextColor,
                    size: CONVERGENC3_TEMPLATE.fonts.size.small * 2, // Updated to use 'small' (9pt) for table headers
                    font: CONVERGENC3_TEMPLATE.fonts.primary,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: CONVERGENC3_TEMPLATE.tables.headerBackgroundColor },
            margins: {
              top: CONVERGENC3_TEMPLATE.tables.cellPadding,
              bottom: CONVERGENC3_TEMPLATE.tables.cellPadding,
              left: CONVERGENC3_TEMPLATE.tables.cellPadding,
              right: CONVERGENC3_TEMPLATE.tables.cellPadding,
            },
            borders: {
              top: {
                style: BorderStyle.SINGLE,
                size: CONVERGENC3_TEMPLATE.tables.borderWidth,
                color: CONVERGENC3_TEMPLATE.tables.borderColor,
              },
              bottom: {
                style: BorderStyle.SINGLE,
                size: CONVERGENC3_TEMPLATE.tables.borderWidth,
                color: CONVERGENC3_TEMPLATE.tables.borderColor,
              },
              left: {
                style: BorderStyle.SINGLE,
                size: CONVERGENC3_TEMPLATE.tables.borderWidth,
                color: CONVERGENC3_TEMPLATE.tables.borderColor,
              },
              right: {
                style: BorderStyle.SINGLE,
                size: CONVERGENC3_TEMPLATE.tables.borderWidth,
                color: CONVERGENC3_TEMPLATE.tables.borderColor,
              },
            },
          }),
      ),
      tableHeader: true,
    }),
  )

  dataRows.forEach((row, index) => {
    if (row.length > 0) {
      rows.push(
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: parseInlineMarkdown(cell),
                    spacing: { before: 60, after: 60 },
                  }),
                ],
                shading: {
                  fill: index % 2 === 0 ? CONVERGENC3_TEMPLATE.tables.alternateRowColor : "FFFFFF",
                },
                margins: {
                  top: 60,
                  bottom: 60,
                  left: CONVERGENC3_TEMPLATE.tables.cellPadding,
                  right: CONVERGENC3_TEMPLATE.tables.cellPadding,
                },
                borders: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: CONVERGENC3_TEMPLATE.tables.tableBorder,
                  },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: CONVERGENC3_TEMPLATE.tables.tableBorder,
                  },
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: CONVERGENC3_TEMPLATE.tables.tableBorder,
                  },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: CONVERGENC3_TEMPLATE.tables.tableBorder,
                  },
                },
              }),
          ),
        }),
      )
    }
  })

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: CONVERGENC3_TEMPLATE.tables.borderColor,
      },
      bottom: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: CONVERGENC3_TEMPLATE.tables.borderColor,
      },
      left: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: CONVERGENC3_TEMPLATE.tables.borderColor,
      },
      right: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: CONVERGENC3_TEMPLATE.tables.borderColor,
      },
      insideHorizontal: {
        style: BorderStyle.SINGLE,
        size: 4,
        color: CONVERGENC3_TEMPLATE.tables.tableBorder,
      },
      insideVertical: {
        style: BorderStyle.SINGLE,
        size: 4,
        color: CONVERGENC3_TEMPLATE.tables.tableBorder,
      },
    },
  })
}

function cleanText(text: string): string {
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "").trim()
}

function parseInlineMarkdown(text: string): TextRun[] {
  const runs: TextRun[] = []
  const parts: { text: string; bold?: boolean; italic?: boolean }[] = []

  let currentText = ""
  let i = 0

  while (i < text.length) {
    if (text[i] === "*") {
      if (text[i + 1] === "*") {
        if (currentText) {
          parts.push({ text: currentText })
          currentText = ""
        }
        i += 2
        let boldText = ""
        while (i < text.length && !(text[i] === "*" && text[i + 1] === "*")) {
          boldText += text[i]
          i++
        }
        if (boldText) {
          parts.push({ text: boldText, bold: true })
        }
        i += 2
      } else {
        if (currentText) {
          parts.push({ text: currentText })
          currentText = ""
        }
        i++
        let italicText = ""
        while (i < text.length && text[i] !== "*") {
          italicText += text[i]
          i++
        }
        if (italicText) {
          parts.push({ text: italicText, italic: true })
        }
        i++
      }
    } else {
      currentText += text[i]
      i++
    }
  }

  if (currentText) {
    parts.push({ text: currentText })
  }

  parts.forEach((part) => {
    runs.push(
      new TextRun({
        text: part.text,
        bold: part.bold || false,
        italics: part.italic || false,
        font: CONVERGENC3_TEMPLATE.fonts.body,
        size: CONVERGENC3_TEMPLATE.fonts.size.body * 2,
      }),
    )
  })

  return runs.length > 0
    ? runs
    : [
        new TextRun({
          text,
          font: CONVERGENC3_TEMPLATE.fonts.body,
          size: CONVERGENC3_TEMPLATE.fonts.size.body * 2,
        }),
      ]
}
