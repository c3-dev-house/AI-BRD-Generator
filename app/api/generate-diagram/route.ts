import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function cleanDotSyntax(code: string): string {
  let cleaned = code
    .replace(/```dot|```graphviz|```/g, "")
    .trim()

  // Ensure it starts with digraph
  if (!cleaned.startsWith("digraph")) {
    const braceOpen = cleaned.indexOf("{")
    if (braceOpen !== -1) {
      cleaned = "digraph ProcessMap " + cleaned.substring(braceOpen)
    }
  }

  return cleaned
}

function validateDotSyntax(code: string): { valid: boolean; error?: string } {
  try {
    const cleaned = cleanDotSyntax(code)
    if (!cleaned) return { valid: false, error: "Empty diagram code" }

    if (!cleaned.includes("digraph") && !cleaned.includes("{")) {
      return { valid: false, error: "Invalid DOT syntax: Missing 'digraph' or '{'" }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Unknown validation error" }
  }
}

function generateFallbackDiagram(type: string, extractedText: string): string {
  if (type === "current-state") {
    return `digraph CurrentState {
  rankdir="LR";
  fontname="Arial";
  node [fontname="Arial", fontsize=10];
  edge [fontname="Arial", fontsize=8];

  subgraph cluster_BA {
    label = "Business Analyst";
    style = "rounded";
    bgcolor = "#FFFFFF";
    color = "#00486D";

    Start [label="Start: Project Initiated", shape=circle, style=filled, fillcolor="#6EAB24", fontcolor="white", width=0.8, fixedsize=true];
    RecBrief [label="Receive Project Brief", shape=box, style="rounded,filled", fillcolor="#CCCCCC", color="#00486D", fontcolor="black"];
    CollectDocs [label="Collect Supporting Docs", shape=box, style="rounded,filled", fillcolor="#CCCCCC", color="#00486D", fontcolor="black"];
    Review [label="Review and Extract Info", shape=box, style="rounded,filled", fillcolor="#CCCCCC", color="#00486D", fontcolor="black"];
    
    Decision [label="Info Adequate?", shape=diamond, style=filled, fillcolor="#fff2cc", color="#d6b656", fontcolor="black"];
    Draft [label="Draft Initial BRD", shape=box, style="rounded,filled", fillcolor="#CCCCCC", color="#00486D", fontcolor="black"];
  }

  subgraph cluster_PM {
    label = "Project Manager";
    style = "rounded";
    bgcolor = "#FFFFFF";
    color = "#00486D";

    InternalReview [label="Internal Review", shape=box, style="rounded,filled", fillcolor="#CCCCCC", color="#00486D", fontcolor="black"];
    ApproveDecision [label="Approved?", shape=diamond, style=filled, fillcolor="#fff2cc", color="#d6b656", fontcolor="black"];
    Submit [label="Submit BRD", shape=box, style="rounded,filled", fillcolor="#CCCCCC", color="#00486D", fontcolor="black"];
  }

  Start -> RecBrief;
  RecBrief -> CollectDocs;
  CollectDocs -> Review;
  Review -> Decision;
  Decision -> CollectDocs [label="No"];
  Decision -> Draft [label="Yes"];
  Draft -> InternalReview;
  InternalReview -> ApproveDecision;
  ApproveDecision -> Draft [label="No"];
  ApproveDecision -> Submit [label="Yes"];

  End [label="End: BRD Approved", shape=doublecircle, style="filled,bold", fillcolor="black", color="#e61414", fontcolor="white", width=0.8, fixedsize=true];
  Submit -> End;
}`
  } else {
    return `digraph FutureState {
  rankdir="LR";
  fontname="Arial";
  node [fontname="Arial"];

  subgraph cluster_System {
    label = "AI Agent System";
    style = "dashed";
    color = "#00486D";

    Extract [label="Extract Content", shape=box, style="rounded,filled", fillcolor="#CCCCCC", color="#00486D", fontcolor="black"];
    Generate [label="Generate Document", shape=box, style="rounded,filled", fillcolor="#CCCCCC", color="#00486D", fontcolor="black"];
    Database [label="Knowledge Base", shape=cylinder, style="filled,dashed", fillcolor="white", color="#00486D", fontcolor="black"];
  }

  Start [label="Start", shape=circle, style=filled, fillcolor="#6EAB24", fontcolor="white"];
  Start -> Extract;
  Extract -> Database [dir=both, label="Query"];
  Database -> Generate;
  
  End [label="End", shape=doublecircle, style="filled,bold", fillcolor="black", color="#e61414", fontcolor="white"];
  Generate -> End;
}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { extractedText, diagramType = "current-state" } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    console.log("[v0] Generating DOT diagram:", diagramType)

    const systemPrompt = `You are a C3 Business Process Expert. Your task is to generate a process map that STRICTLY follows the C3 BPMN Template standards using Graphviz (DOT) syntax.

C3 BPMN STANDARD RULES:
1. Task Naming: All operational steps MUST use the format "VERB-ADJECTIVE-NOUN" (e.g., "Review Submitted Application").
2. Direction: Use 'rankdir="TB"' (Top to Bottom) or 'rankdir="LR"' (Left to Right).
3. Swimlanes (Roles): Use 'subgraph cluster_RoleName { label="Role Name"; ... }'.
4. Node IDs: MUST be Alphanumeric ONLY (e.g., "ReviewApp", "SubmitForm"). NO hyphens, spaces, or special characters in IDs.

NODE STYLING (Strict Enforcement):
- Start Event: shape=circle, style=filled, fillcolor="#6EAB24", fontcolor="white", fixedsize=true, width=1.2
- End Event: shape=doublecircle, style="filled,bold", fillcolor="black", color="#e61414", fontcolor="white", fixedsize=true, width=1.0
- Activity/Task: shape=box, style="rounded,filled", fillcolor="#CCCCCC", color="#00486D", fontcolor="black", height=0.6
- Decision Gateway: shape=diamond, style=filled, fillcolor="#fff2cc", color="#d6b656", fontcolor="black"
- Systems/Databases: shape=cylinder, style="filled,dashed", fillcolor="white", color="#00486D", fontcolor="black"

OUTPUT FORMAT:
digraph ProcessMap {
  graph [fontname="Arial", rankdir="TB", splines=ortho];
  node [fontname="Arial", fontsize=10];
  edge [fontname="Arial", fontsize=9];

  subgraph cluster_Role1 {
    label = "Role Name";
    style = "rounded";
    bgcolor = "#FFFFFF";
    color = "#00486D"; (Blue border for swimlane)

    Node1 [label="Step Name", ...style...];
  }
}

CONTEXTUAL LOGIC:
- ${diagramType === "current-state"
        ? "Map the current process 'As-Is'. Highlight manual tasks."
        : "Map the future 'To-Be' process. Show how 'Systems' interact with 'Activities'."}

OUTPUT: ONLY valid DOT code. NO markdown blocks.`

    let dotCode = ""

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a ${diagramType} diagram based on this text:\n\n${extractedText.substring(0, 3000)}` },
        ],
        model: "gpt-4o",
        temperature: 0.1, // Low temperature for deterministic code
      })

      const rawCode = completion.choices[0].message.content || ""
      dotCode = cleanDotSyntax(rawCode)

      const validation = validateDotSyntax(dotCode)
      if (!validation.valid) {
        console.error("[v0] Invalid DOT syntax generated:", validation.error)
        dotCode = generateFallbackDiagram(diagramType, extractedText)
      }
    } catch (error) {
      console.error("[v0] AI generation failed, using fallback:", error)
      dotCode = generateFallbackDiagram(diagramType, extractedText)
    }

    return NextResponse.json({
      success: true,
      dotCode,
      diagramType, // Kept to allow frontend to know the type
    })
  } catch (error) {
    console.error("[v0] Critical error in diagram generation:", error)

    const fallbackCode = generateFallbackDiagram("current-state", "")

    return NextResponse.json({
      success: true,
      dotCode: fallbackCode,
      diagramType: "current-state",
    })
  }
}
