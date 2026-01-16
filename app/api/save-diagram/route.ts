import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for diagrams (replace with database in production)
const diagramStore: Map<string, string> = new Map()

export async function POST(request: NextRequest) {
  try {
    const { diagramId, diagramData } = await request.json()

    if (!diagramId || !diagramData) {
      return NextResponse.json(
        { error: 'Missing diagramId or diagramData' },
        { status: 400 }
      )
    }

    // Store diagram (SVG or PNG base64)
    diagramStore.set(diagramId, diagramData)

    console.log(' Diagram saved:', diagramId)

    return NextResponse.json({ 
      success: true,
      diagramId,
      message: 'Diagram saved successfully'
    })
  } catch (error) {
    console.error(' Error saving diagram:', error)
    return NextResponse.json(
      { error: 'Failed to save diagram' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const diagramId = searchParams.get('diagramId')

    if (!diagramId) {
      return NextResponse.json(
        { error: 'Missing diagramId parameter' },
        { status: 400 }
      )
    }

    const diagramData = diagramStore.get(diagramId)

    if (!diagramData) {
      return NextResponse.json(
        { error: 'Diagram not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ diagramData })
  } catch (error) {
    console.error(' Error retrieving diagram:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve diagram' },
      { status: 500 }
    )
  }
}
