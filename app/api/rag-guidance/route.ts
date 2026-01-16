import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { query, results } = await request.json()

    if (!query || !results || results.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    console.log(' Generating RAG guidance for query:', query)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert Business Analyst helping users understand document search results and make informed decisions about which context to include in their Business Requirements Document.

Your task is to:
1. Analyze the user's search query and the top search results
2. Explain which chunks are most relevant and why
3. Provide recommendations on which contexts to select
4. Highlight key information that should definitely be included

Be concise, practical, and actionable. Your guidance should be 2-4 sentences maximum.`,
        },
        {
          role: 'user',
          content: `User searched for: "${query}"

Top search results:
${results.map((r: any, i: number) => `${i + 1}. (${(r.similarity * 100).toFixed(1)}% match) ${r.text.slice(0, 200)}...`).join('\n\n')}

Provide guidance on which results are most relevant and should be selected for BRD generation.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    const guidance = completion.choices[0]?.message?.content || ''

    console.log(' RAG guidance generated successfully')

    return NextResponse.json({
      success: true,
      guidance,
    })
  } catch (error) {
    console.error(' RAG guidance error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate guidance' },
      { status: 500 }
    )
  }
}
