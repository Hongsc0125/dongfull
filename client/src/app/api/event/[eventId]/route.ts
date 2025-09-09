import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    
    // 백엔드 서버로 요청 프록시
    const response = await fetch(`http://localhost:3001/api/event/${eventId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Event not found' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}