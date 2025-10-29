import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        name: 'Mãe',
        birthdate: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in /api/eu360/profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
