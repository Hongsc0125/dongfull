import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();
    
    // 개발 환경에서는 콘솔에도 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CLIENT LOG] ${logData.level.toUpperCase()}: ${logData.message}`, logData.context);
    }
    
    // 백엔드 서버로 로그 전달 (선택사항)
    if (process.env.BACKEND_URL) {
      try {
        await fetch(`${process.env.BACKEND_URL}/api/logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logData)
        });
      } catch (error) {
        // 백엔드로의 로그 전송이 실패해도 클라이언트 로깅은 성공으로 처리
        console.warn('Failed to forward log to backend:', error);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process client log:', error);
    return NextResponse.json(
      { error: 'Failed to process log' },
      { status: 500 }
    );
  }
}