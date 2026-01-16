import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { extractedText, templateId, ragContext, hasDiagrams, diagramCount } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    console.log('[v0] Validating requirements with full context:', {
      template: templateId,
      hasRAG: !!ragContext,
      diagrams: diagramCount
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert Business Analyst with 15+ years of experience in requirements gathering and BRD creation.

Your task is to analyze the ACTUAL DOCUMENT CONTENT and identify MISSING CRITICAL INFORMATION needed for a complete Business Requirements Document.

**CRITICAL**: Base your analysis ONLY on what IS or IS NOT present in the document content provided. Do not assume or guess.

Check for these essential elements IN THE DOCUMENT:
1. **Business Problem/Opportunity** - Clear problem statement, root causes, and opportunity description
2. **Business Objectives** - Specific, measurable goals (SMART criteria)
3. **Scope** - What's explicitly in scope and out of scope
4. **Stakeholders** - Named stakeholders with roles and responsibilities
5. **Current State** - Detailed description of existing processes/systems
6. **Future State** - Clear vision for the solution and benefits
7. **Functional Requirements** - Specific features and capabilities
8. **Non-Functional Requirements** - Performance, security, scalability needs
9. **Assumptions & Constraints** - Project limitations and assumptions
10. **Success Criteria** - Measurable KPIs and acceptance criteria
11. **Timeline/Budget** - Project duration and budget estimates
12. **Dependencies** - External dependencies and integration requirements

Respond in JSON format:
{
  "missingItems": [
    {
      "category": "Business Objectives",
      "question": "What are the specific, measurable business objectives for this initiative?",
      "importance": "critical",
      "suggestedPrompt": "Please provide 3-5 specific business objectives with measurable success criteria (e.g., 'Reduce operational costs by 20% within 12 months')"
    }
  ],
  "completenessScore": 75,
  "readyToGenerate": false,
  "recommendations": ["Add specific success metrics with target dates", "Define stakeholder RACI matrix with names"],
  "foundElements": ["Business Problem", "Current State"]
}

**Importance Levels**:
- **critical**: Document cannot be generated without this (Problem, Objectives, Scope)
- **high**: Significantly impacts document quality (Stakeholders, Success Criteria, Requirements)
- **medium**: Enhances document completeness (Timeline, Budget, Dependencies)`,
        },
        {
          role: 'user',
          content: `Analyze this document content for completeness for a ${templateId} BRD template.

**DOCUMENT CONTENT**:
${extractedText.slice(0, 10000)}

${ragContext ? `\n**ADDITIONAL CONTEXT FROM RAG SEARCH**:\n${ragContext.slice(0, 2000)}\n` : ''}

${hasDiagrams ? `\n**NOTE**: User has created ${diagramCount} process diagram(s).\n` : ''}

**INSTRUCTIONS**:
1. Read the ACTUAL content above carefully
2. Identify what critical information is ACTUALLY MISSING from the text
3. Only flag items that are truly absent or incomplete
4. Generate specific questions that would help complete the BRD
5. Do NOT assume information is missing if it's implied or partially present

Return JSON with missing items, completeness score (0-100), and recommendations.`,
        },
      ],
      max_tokens: 2500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const validation = JSON.parse(completion.choices[0]?.message?.content || '{}')

    console.log('[v0] Validation complete:', {
      score: validation.completenessScore,
      missing: validation.missingItems?.length || 0,
      ready: validation.readyToGenerate
    })

    return NextResponse.json({
      success: true,
      ...validation,
    })
  } catch (error) {
    console.error('[v0] Validation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Validation failed' },
      { status: 500 }
    )
  }
}
