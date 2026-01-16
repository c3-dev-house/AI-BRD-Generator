import { NextResponse } from 'next/server'
import { BRD_TEMPLATES } from '@/lib/brd-templates'

export async function GET() {
  try {
    return NextResponse.json({ templates: BRD_TEMPLATES })
  } catch (error) {
    console.error(' Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
