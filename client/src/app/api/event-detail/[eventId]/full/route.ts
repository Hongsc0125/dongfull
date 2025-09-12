import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.eventId;
    
    // 백엔드 서버로 프록시
    const backendUrl = `http://localhost:3001/api/event-detail/${eventId}/full`;
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return new NextResponse('Event not found', { status: 404 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching event detail:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}