import { NextRequest, NextResponse } from 'next/server';
import { buildReport } from '@/app/lib/pdf/buildReport';

/**
 * PDF Export API Route
 * Generates PDF reports server-side to avoid chunk load errors
 *
 * Usage: POST /api/pdf/export
 * Body: { variant: 'wellness' | 'insights', data: {...} }
 * Response: PDF blob
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variant, data } = body;

    if (!variant || !data) {
      return NextResponse.json(
        { error: 'Missing variant or data' },
        { status: 400 }
      );
    }

    if (variant !== 'wellness' && variant !== 'insights') {
      return NextResponse.json(
        { error: 'Invalid variant' },
        { status: 400 }
      );
    }

    // Build the PDF blob
    const blob = await buildReport(variant, data);

    // Convert blob to buffer
    const buffer = await blob.arrayBuffer();

    // Generate filename based on variant and date
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `materna360-${variant}-${dateStr}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('PDF export API error:', error);
    
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: errorMsg },
      { status: 500 }
    );
  }
}
