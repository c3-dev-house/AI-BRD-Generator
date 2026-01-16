import { NextResponse } from "next/server"
import OpenAI from "openai"
import { CONVERGENC3_BRD_PROMPT } from "@/lib/convergenc3-template-config"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// This default prompt is used for non-Convergenc3 templates
const DEFAULT_BRD_PROMPT = `You are a BRD Generator AI, designed to produce professional Business Requirements Documents.

**CRITICAL: USE THE UPLOADED DOCUMENT CONTENT. DO NOT GENERATE GENERIC EXAMPLES.**

Generate a complete, professional BRD with all sections fully detailed based on the uploaded document content.`

export async function POST(request: Request) {
  try {
    const { extractedText, templateId, ragContext, additionalInfo, missingInfo, diagrams } = await request.json()

    if (!extractedText || extractedText.trim() === "") {
      console.error("[v0] BRD Generation Error: No extracted text provided")
      return NextResponse.json(
        { error: "No document content provided. Please upload a document first." },
        { status: 400 },
      )
    }

    const currentDate = new Date().toISOString().split("T")[0] // Format: YYYY-MM-DD
    console.log("[v0] ⚠️ USING CURRENT DATE FOR BRD:", currentDate)

    const MAX_EXTRACTED_TEXT_LENGTH = 30000 // ~6000 tokens (safe for 8K context models)
    let truncatedText = extractedText
    if (extractedText.length > MAX_EXTRACTED_TEXT_LENGTH) {
      truncatedText =
        extractedText.substring(0, MAX_EXTRACTED_TEXT_LENGTH) +
        "\n\n[Content truncated due to length. Showing first 30,000 characters.]"
      console.warn(
        "[v0] Extracted text truncated from",
        extractedText.length,
        "to",
        MAX_EXTRACTED_TEXT_LENGTH,
        "characters",
      )
    }

    console.log("[v0] BRD Generation Request:", {
      extractedTextLength: truncatedText.length,
      extractedTextPreview: truncatedText.substring(0, 500) + "...",
      template: templateId,
      ragChunks: ragContext?.length || 0,
      diagrams: diagrams?.length || 0,
    })

    let contextSection = ""
    if (ragContext && ragContext.length > 0) {
      contextSection = `\n\nADDITIONAL CONTEXT FROM DOCUMENT SEARCH:\n\n${ragContext.map((chunk: string, idx: number) => `[Context ${idx + 1}]:\n${chunk}`).join("\n\n")}\n\n`
    }

    let templateInstructions = templateId === "convergenc3" || !templateId ? CONVERGENC3_BRD_PROMPT : DEFAULT_BRD_PROMPT

    if (templateId === "agile") {
      templateInstructions +=
        "\n\nFOCUS ON AGILE: Emphasize user stories, epics, acceptance criteria, and sprint planning. Use agile terminology and lightweight structure."
    } else if (templateId === "it-technical") {
      templateInstructions +=
        "\n\nFOCUS ON TECHNICAL: Emphasize architecture diagrams, integration requirements, non-functional requirements, and security. Use technical terminology."
    } else if (templateId === "corporate") {
      templateInstructions +=
        "\n\nFOCUS ON CORPORATE: Emphasize formal structure, approval processes, risk assessment, and executive summaries suitable for board presentation."
    }

    let missingInfoSection = ""
    if (missingInfo && missingInfo.length > 0) {
      missingInfoSection = `\n\n**IMPORTANT - Missing Information:**\nThe following information was not found in the uploaded document and should be added during review:\n${missingInfo.map((item: any) => `- ${item.category}: ${item.question}`).join("\n")}\n\n`

      if (additionalInfo && Object.keys(additionalInfo).length > 0) {
        missingInfoSection += `\n**User-Provided Additional Information:**\n${Object.entries(additionalInfo)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join("\n")}\n\n`
      }
    }

    const userMessage = `Generate a complete, professional Business Requirements Document following the ${templateId === "convergenc3" ? "Convergenc3 BRD Template" : "standard BRD format"} exactly.

**⚠️⚠️⚠️ MANDATORY DATE REQUIREMENT ⚠️⚠️⚠️**
YOU MUST USE THIS EXACT DATE: ${currentDate}
- In the Revision History table: Use ${currentDate} as the date for Version 0.1
- Format: ${currentDate} (YYYY-MM-DD)
- DO NOT use any other date
- DO NOT use dates from the uploaded document
- DO NOT make up dates
- USE ONLY: ${currentDate}

**IMPORTANT: You MUST use the actual information from the uploaded document below. Do NOT generate generic or placeholder content.**

**PROJECT DOCUMENTATION (READ THIS CAREFULLY AND USE ALL RELEVANT INFORMATION):**
${truncatedText}${contextSection}${missingInfoSection}

**INSTRUCTIONS:**
1. Extract the ACTUAL project name, objectives, stakeholders, and requirements from the documentation above
2. Use REAL business problems, opportunities, and solutions described in the uploaded content
3. Generate user stories based on the ACTUAL functionality and features mentioned in the document
4. If specific details are missing, make reasonable inferences and note them as assumptions
5. Create a comprehensive, professional BRD that accurately reflects the uploaded project information

**Remember: This BRD must be based on the REAL project described in the documentation, not generic examples.**`

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: templateInstructions,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens:  32768, // Increased for comprehensive BRDs
      temperature: 0.7,
    })

    const brdText = completion.choices[0]?.message?.content

    if (!brdText) {
      console.error("[v0] OpenAI returned empty response")
      throw new Error("No response from OpenAI")
    }

    console.log("[v0] BRD generated successfully:", {
      contentLength: brdText.length,
      templateUsed: templateId || "convergenc3",
    })

    return NextResponse.json({
      success: true,
      brd: brdText,
    })
  } catch (error) {
    console.error("[v0] BRD generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate BRD" },
      { status: 500 },
    )
  }
}
