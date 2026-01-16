import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function cleanMermaidSyntax(code: string): string {
  return code
    .replace(/```mermaid|```/g, "")
    .trim()
    .split("\n")
    .filter((line) => !line.trim().startsWith("%%"))
    .join("\n")
    .replace(/\[([^\]]*)\]\s*\[/g, "[$1]")
    .replace(/$$\(([^)]*)$$\)\s*\(/g, "(($1))")
    .replace(/\|\|/g, "|")
    .replace(/"/g, "'")
    .replace(/&/g, "and")
    .replace(/\{([^}]*)\}\s*\{/g, "{$1}")
    .replace(/[^\w\s[\]$$$${}\->|#:/,.']/g, "")
}

function validateMermaidSyntax(code: string): { valid: boolean; error?: string } {
  try {
    const cleaned = code.replace(/```mermaid|```/g, "").trim()

    if (!cleaned) {
      return { valid: false, error: "Empty diagram code" }
    }

    const validTypes = ["graph", "flowchart"]
    const hasValidType = validTypes.some((t) => cleaned.startsWith(t))

    if (!hasValidType) {
      return { valid: false, error: "Must use graph or flowchart type" }
    }

    const openBrackets = (cleaned.match(/\[/g) || []).length
    const closeBrackets = (cleaned.match(/\]/g) || []).length
    if (openBrackets !== closeBrackets) {
      return { valid: false, error: "Unbalanced square brackets" }
    }

    const openParens = (cleaned.match(/\(/g) || []).length
    const closeParens = (cleaned.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      return { valid: false, error: "Unbalanced parentheses" }
    }

    const openBraces = (cleaned.match(/\{/g) || []).length
    const closeBraces = (cleaned.match(/\}/g) || []).length
    if (openBraces !== closeBraces) {
      return { valid: false, error: "Unbalanced curly braces" }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Unknown validation error" }
  }
}

function generateFallbackDiagram(type: string, extractedText: string): string {
  if (type === "current-state") {
    return `flowchart LR
    subgraph BA[Business Analyst]
      A([Start: Project Initiated]) --> B[Receive Project Brief]
      B --> C[Collect Supporting Docs]
      C --> D[Review and Extract Info]
      D --> E{Information Adequate?}
      E -->|No| C
      E -->|Yes| F[Draft Initial BRD]
      F --> G[Format Document]
    end
    
    subgraph PM[Project Manager]
      H[Internal Review] --> I{Approved?}
      I -->|No| J[Apply Feedback]
      I -->|Yes| K[Submit BRD]
    end
    
    G --> H
    J --> K
    K --> L([End: BRD Approved])
    
    style A fill:#6EAB24,stroke:#333,stroke-width:2px
    style L fill:#000,stroke:#e61414,stroke-width:2px
    style B fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style C fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style D fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style F fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style G fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style H fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style J fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style K fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style E fill:#FFD700,stroke:#FF9900,stroke-width:2px
    style I fill:#FFD700,stroke:#FF9900,stroke-width:2px`
  } else {
    return `flowchart LR
    subgraph BA[Business Analyst]
      A([Start: Project Initiated]) --> B[Upload Documents]
      B --> C[Review AI Output]
      C --> D[Refine Content]
    end
    
    subgraph AI[AI Agent System]
      E[Extract Content] --> F[Structure BRD]
      F --> G[Generate Document]
      G --> H[Apply Template]
    end
    
    subgraph PM[Project Manager]
      I[Quick Review] --> J{Approved?}
      J -->|No| D
      J -->|Yes| K[Submit BRD]
    end
    
    B --> E
    H --> C
    D --> I
    K --> L([End: BRD Approved])
    
    style A fill:#6EAB24,stroke:#333,stroke-width:2px
    style L fill:#000,stroke:#e61414,stroke-width:2px
    style B fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style C fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style D fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style I fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style K fill:#CCCCCC,stroke:#00486D,stroke-width:2px
    style E fill:#009DE0,stroke:#00486D,stroke-width:2px
    style F fill:#009DE0,stroke:#00486D,stroke-width:2px
    style G fill:#009DE0,stroke:#00486D,stroke-width:2px
    style H fill:#009DE0,stroke:#00486D,stroke-width:2px
    style J fill:#FFD700,stroke:#FF9900,stroke-width:2px`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { extractedText, diagramType = "current-state" } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    console.log("[v0] Generating process diagram:", diagramType)

    const systemPrompt = `You are a business process expert. Create a ${diagramType === "current-state" ? "Current State" : "Future State"} process map using Mermaid flowchart.

STRICT SYNTAX RULES:
1. Start with: flowchart LR
2. Use subgraph for swimlanes: subgraph BA[Business Analyst]
3. Node formats ONLY:
   - Start/End events: ([Text])
   - Tasks: [Text]
   - Decisions: {Text?}
4. Connections: A --> B or A -->|Label| B
5. NO quotes, NO special characters in node IDs
6. Use simple IDs: A, B, C, D, etc.

${
  diagramType === "current-state"
    ? `CURRENT STATE CONTENT:
- Show manual, time-consuming steps
- Include: Receive, Collect, Review, Draft, Format, Review, Feedback, Submit
- 2-3 swimlanes: Business Analyst, Project Manager
- 2-3 decision points
- Show iteration loops`
    : `FUTURE STATE CONTENT:
- Show AI automation
- Include: Upload, AI Extract, AI Generate, Review, Approve, Submit
- 3 swimlanes: Business Analyst, AI Agent System, Project Manager
- 1-2 decision points
- Highlight automation in AI swimlane`
}

STYLING (apply to ALL nodes):
- Start: style A fill:#6EAB24,stroke:#333,stroke-width:2px
- End: style Z fill:#000,stroke:#e61414,stroke-width:2px
- Tasks: style X fill:#CCCCCC,stroke:#00486D,stroke-width:2px
- AI Tasks: style X fill:#009DE0,stroke:#00486D,stroke-width:2px
- Decisions: style X fill:#FFD700,stroke:#FF9900,stroke-width:2px

OUTPUT: Valid Mermaid flowchart code ONLY. NO explanations, NO markdown.`

    let mermaidCode = ""

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Based on this BRD content, create a ${diagramType === "current-state" ? "Current State" : "Future State"} process map:\n\n${extractedText.slice(0, 4000)}\n\nOutput ONLY valid Mermaid syntax.`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      })

      const rawCode = completion.choices[0]?.message?.content || ""
      mermaidCode = cleanMermaidSyntax(rawCode)

      const validationResult = validateMermaidSyntax(mermaidCode)

      if (!validationResult.valid) {
        console.warn(`[v0] AI diagram validation failed: ${validationResult.error}. Using fallback.`)
        mermaidCode = generateFallbackDiagram(diagramType, extractedText)
      }
    } catch (error) {
      console.error("[v0] AI generation failed, using fallback:", error)
      mermaidCode = generateFallbackDiagram(diagramType, extractedText)
    }

    const finalValidation = validateMermaidSyntax(mermaidCode)
    if (!finalValidation.valid) {
      console.error("[v0] Final validation failed, forcing fallback")
      mermaidCode = generateFallbackDiagram(diagramType, extractedText)
    }

    return NextResponse.json({
      success: true,
      mermaidCode,
      diagramType,
    })
  } catch (error) {
    console.error("[v0] Critical error in diagram generation:", error)

    const fallbackCode = generateFallbackDiagram("current-state", "")

    return NextResponse.json({
      success: true,
      mermaidCode: fallbackCode,
      diagramType: "current-state",
    })
  }
}
