#!/bin/bash

# Event Board 시작 스크립트
echo "🚀 Event Board 시작 중..."

# 이전 프로세스 정리
echo "📝 기존 프로세스 확인 중..."
pkill -f "node src/server/index.js" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# 의존성 확인
if [ ! -d "node_modules" ]; then
    echo "📦 루트 의존성 설치 중..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 클라이언트 의존성 설치 중..."
    cd client && npm install && cd ..
fi

# 로그 디렉토리 생성
mkdir -p logs

echo "🎯 서비스 시작 중..."

# 1. Express API 서버 (백엔드 + 봇)
echo "🤖 Discord 봇 및 API 서버 시작 중... (포트 3001)"
nohup npm run server:dev > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > logs/backend.pid

# 서버 시작 대기
echo "⏳ API 서버 시작 대기 중..."
sleep 5

# 2. Next.js 웹 앱
echo "🌐 웹 앱 시작 중... (포트 3777)"
cd client
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

echo "✅ Event Board가 시작되었습니다!"
echo ""
echo "📋 로그 확인:"
echo "  백엔드: tail -f logs/backend.log"
echo "  프론트엔드: tail -f logs/frontend.log"
echo ""
echo "⏹️  중지하려면: ./stop.sh"

# 프로세스 상태 확인
sleep 3
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ 백엔드 서버: 실행 중 (PID: $BACKEND_PID)"
else
    echo "❌ 백엔드 서버: 시작 실패"
fi

if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ 프론트엔드 서버: 실행 중 (PID: $FRONTEND_PID)"
else
    echo "❌ 프론트엔드 서버: 시작 실패"
fi

echo ""
echo "🎉 모든 서비스가 준비되었습니다!"