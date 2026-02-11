import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const queryString = searchParams.toString();
    
    // 백엔드 서버로 요청 프록시
    const backendUrl = `http://localhost:3001/api/guild/${guildId}/members${queryString ? '?' + queryString : ''}`;
    const response = await fetch(backendUrl);

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}