#!/bin/bash

# Event Board 중지 스크립트
echo "🛑 Event Board 중지 중..."

# PID 파일에서 프로세스 종료
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "🤖 백엔드 서버 중지 중... (PID: $BACKEND_PID)"
        kill $BACKEND_PID
        sleep 2
        if ps -p $BACKEND_PID > /dev/null; then
            echo "🔥 강제 종료 중..."
            kill -9 $BACKEND_PID
        fi
        echo "✅ 백엔드 서버 중지됨"
    else
        echo "ℹ️  백엔드 서버가 이미 중지되어 있습니다"
    fi
    rm -f logs/backend.pid
else
    echo "ℹ️  백엔드 PID 파일을 찾을 수 없습니다"
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "🌐 프론트엔드 서버 중지 중... (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID
        sleep 2
        if ps -p $FRONTEND_PID > /dev/null; then
            echo "🔥 강제 종료 중..."
            kill -9 $FRONTEND_PID
        fi
        echo "✅ 프론트엔드 서버 중지됨"
    else
        echo "ℹ️  프론트엔드 서버가 이미 중지되어 있습니다"
    fi
    rm -f logs/frontend.pid
else
    echo "ℹ️  프론트엔드 PID 파일을 찾을 수 없습니다"
fi

# 추가로 관련 프로세스들 정리
echo "🧹 관련 프로세스 정리 중..."
pkill -f "node src/server/index.js" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

echo ""
echo "✅ Event Board가 완전히 중지되었습니다"
echo "🗂️  로그 파일은 logs/ 디렉토리에 보관됩니다"