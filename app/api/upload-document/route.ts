import { NextRequest, NextResponse } from 'next/server'
import { getDocumentsCollection } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const sessionId = Date.now().toString()
    
    const documentsCollection = await getDocumentsCollection()
    await documentsCollection.insertOne({
      sessionId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      content: text,
      uploadedAt: new Date(),
      metadata: {
        originalName: file.name,
        mimeType: file.type,
      }
    })

    return NextResponse.json({ 
      success: true, 
      text,
      sessionId,
      fileName: file.name,
      message: 'Document uploaded and saved to MongoDB successfully'
    })
  } catch (error) {
    console.error(' Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
