import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        motherName: 'Mãe',
        figurinha: 'default',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in /api/profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json(
      {
        success: true,
        motherName: body.motherName || 'Mãe',
        figurinha: body.figurinha || 'default',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/profile:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
