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
          content: `You are an expert Business Analyst with 15+ years of experience.
Your goal is to identify **BLOCKERS** for generating a high-quality BRD.

**CRITICAL INSTRUCTIONS**:
1. **Analyze ACTUALLY MISSING Info**: Only flag items that are completely absent and critical. Do NOT flag items that are implied, generic, or "nice to have".
2. **Context Awareness**: If the document is a "Concept Note" or "High Level Vision", do NOT ask for detailed technical specs.
3. **Be Specific**: Don't just ask "Who are the stakeholders?". Ask "I see a mention of 'Finance Team', but who is the specific approver?".
4. **Reasoning**: Provide a brief reason WHY this information is critical.

Check for these elements:
- Business Problem (Why are we doing this?)
- Key Objectives (What defines success?)
- Core Scope (What is in/out?)
- High-level Requirements (What must it do?)

Respond in JSON:
{
  "missingItems": [
    {
      "category": "Stakeholders",
      "question": "Who is the primary Project Sponsor authorized to approve this budget?",
      "reason": "Required for the 'Governance' section.",
      "importance": "critical",
      "suggestedPrompt": "Please name the Project Sponsor."
    }
  ],
  "completenessScore": 85,
  "readyToGenerate": true, <!-- Set to true if gaps are minor -->
  "recommendations": ["Recommendation 1"]
}`,
        },
        {
          role: 'user',
          content: `Analyze this content (${templateId} template):
          
${extractedText.slice(0, 50000)}

${ragContext ? `\nRAG Context:\n${ragContext.slice(0, 5000)}\n` : ''}
${hasDiagrams ? `\nUser has ${diagramCount} diagrams.` : ''}`,
        },
      ],
      max_tokens: 4000,
      temperature: 0.2,
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
