import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getVectorCollection } from '@/lib/mongodb'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface EmbeddingChunk {
  id: string
  text: string
  embedding: number[]
  metadata: {
    source: string
    chunkIndex: number
    timestamp: number
  }
}

function chunkText(text: string, chunkSize: number = 500): string[] {
  const chunks: string[] = []
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text]
  
  let currentChunk = ''
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += ' ' + sentence
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

export async function POST(request: NextRequest) {
  try {
    const { action, text, query, sessionId } = await request.json()
    const collection = await getVectorCollection()

    if (action === 'embed') {
      const chunks = chunkText(text)
      console.log(` Created ${chunks.length} chunks from document`)

      const embeddings = await Promise.all(
        chunks.map(async (chunk, index) => {
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: chunk,
          })
          
          return {
            id: `chunk_${sessionId || Date.now()}_${index}`,
            text: chunk,
            embedding: response.data[0].embedding,
            metadata: {
              source: 'uploaded_document',
              chunkIndex: index,
              timestamp: Date.now(),
              sessionId: sessionId || 'default',
            },
          }
        })
      )

      await collection.deleteMany({ 'metadata.sessionId': sessionId || 'default' })
      await collection.insertMany(embeddings as any)
      
      try {
        await collection.createIndex({ embedding: '2dsphere' })
      } catch (err) {
        console.log(' Index already exists or creation failed:', err)
      }
      
      return NextResponse.json({ 
        success: true, 
        chunksCount: chunks.length,
        message: `Document chunked into ${chunks.length} pieces and stored in MongoDB`
      })
    }

    if (action === 'search') {
      const storedEmbeddings = await collection
        .find({ 'metadata.sessionId': sessionId || 'default' })
        .toArray()

      if (storedEmbeddings.length === 0) {
        return NextResponse.json({ 
          results: [],
          message: 'No documents embedded yet. Please upload and embed a document first.'
        })
      }

      const queryEmbeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      })
      
      const queryEmbedding = queryEmbeddingResponse.data[0].embedding

      const results = storedEmbeddings
        .map(chunk => ({
          text: chunk.text,
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
          metadata: chunk.metadata,
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)

      return NextResponse.json({ results })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error(' RAG Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'RAG operation failed' },
      { status: 500 }
    )
  }
}
