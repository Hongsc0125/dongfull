#!/bin/bash

# Event Board 중지 스크립트
echo "🛑 Event Board 중지 중..."

# all.pid 파일에서 모든 프로세스 종료
if [ -f "logs/all.pid" ]; then
    echo "📋 PID 파일에서 프로세스 목록 읽는 중..."
    
    while IFS=':' read -r service_name pid; do
        if [ ! -z "$pid" ] && ps -p $pid > /dev/null; then
            echo "🛑 $service_name 서버 중지 중... (PID: $pid)"
            kill $pid
            sleep 2
            if ps -p $pid > /dev/null; then
                echo "🔥 $service_name 강제 종료 중..."
                kill -9 $pid
            fi
            echo "✅ $service_name 서버 중지됨"
        else
            echo "ℹ️  $service_name 서버가 이미 중지되어 있습니다"
        fi
    done < logs/all.pid
    
    rm -f logs/all.pid
else
    echo "ℹ️  PID 파일을 찾을 수 없습니다"
fi

# 기존 개별 PID 파일들도 정리
rm -f logs/backend.pid logs/frontend.pid

# 추가로 관련 프로세스들 정리
echo "🧹 관련 프로세스 정리 중..."
pkill -f "node src/server/index.js" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

echo ""
echo "✅ Event Board가 완전히 중지되었습니다"
echo "🗂️  로그 파일은 logs/ 디렉토리에 보관됩니다"