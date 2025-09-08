import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = resolvedParams.path.join('/');
    const fullPath = join(process.cwd(), 'public', 'images', filePath);
    
    // 보안을 위한 경로 검증
    if (!fullPath.includes(join(process.cwd(), 'public', 'images'))) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // 파일 존재 확인
    if (!existsSync(fullPath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    const fileBuffer = await readFile(fullPath);
    
    // MIME 타입 설정
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon'
    };
    
    const ext = filePath.toLowerCase().match(/\.[^.]*$/)?.[0] || '';
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    return new NextResponse(fileBuffer as BodyInit, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving static file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}