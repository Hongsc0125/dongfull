# Event Board

Discord 이벤트 관리 및 랭킹 시스템입니다.

## 🚀 기능

- **Discord 봇**: 한국어 슬래시 명령어로 이벤트 관리
- **웹 대시보드**: Next.js + shadcn/ui로 구축된 관리 인터페이스  
- **이벤트 시스템**: 점수/시간 기반 랭킹 관리
- **멤버 캐싱**: 스케줄러를 통한 자동 멤버 동기화
- **점수 집계**: 합산/평균/베스트 스코어 방식 지원

## 📁 프로젝트 구조

```
├── src/
│   ├── bot/              # Discord 봇 관련 코드
│   │   ├── index.js      # 봇 메인 엔트리
│   │   └── commands/     # 한국어 슬래시 명령어
│   ├── database/         # PostgreSQL 데이터베이스
│   │   ├── init.js       # DB 스키마 초기화
│   │   ├── events.js     # 이벤트 관리
│   │   ├── participants.js # 참가자 및 점수 관리
│   │   └── guild-members.js # 멤버 캐싱
│   ├── scheduler/        # 멤버 동기화 스케줄러
│   └── config/           # URL 및 설정 파일
├── client/               # Next.js 웹 앱 (3777 포트)
│   └── src/
│       └── app/          # App Router
└── ecosystem.config.js   # PM2 설정 파일
```

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm run install:all
```

### 2. 환경 변수 설정

루트 디렉토리의 `.env` 파일에서 다음 내용을 설정하세요:

```bash
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Server Configuration  
PORT=3001
NODE_ENV=development

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3777
NEXTAUTH_SECRET=your_32_character_secret

# API URLs
BACKEND_URL=http://localhost:3001

# Database (PostgreSQL)
DATABASE_NAME=event_board
DATABASE_URL=your_postgresql_url
DB_PW=your_db_password
DB_USER=your_db_user
```

### 3. 애플리케이션 실행

**🎯 원클릭 시작 (권장)**
```bash
./start.sh
# 또는
npm run start:all
```

**⏹️ 애플리케이션 중지**
```bash
./stop.sh
# 또는
npm run stop:all
```

**📋 로그 확인**
```bash
npm run logs:backend    # 백엔드 로그
npm run logs:frontend   # 프론트엔드 로그
```

### 4. 개별 실행 (개발용)
```bash
npm run server:dev  # Discord 봇 + API 서버 (포트 3001)
npm run client:dev  # Next.js 웹 앱 (포트 3777)
```

### 5. 접속 정보
- 🌐 **웹 대시보드**: http://localhost:3777
- 🔌 **API 서버**: http://localhost:3001
- 📊 **건강 체크**: http://localhost:3001/api/health

## 🤖 Discord 봇 명령어 (한국어)

- `/이벤트생성` - 새로운 랭킹 이벤트 생성 (관리자)
- `/점수추가` - 참가자에게 점수 추가 (관리자)  
- `/순위` - 이벤트 리더보드 확인
- `/이벤트목록` - 서버의 모든 이벤트 목록
- `/이벤트정보` - 특정 이벤트 상세 정보
- `/이벤트토글` - 이벤트 활성화/비활성화 (관리자)

## 🌐 API 엔드포인트

- `GET /api/health` - 서버 상태 확인
- `GET /api/bot/status` - 봇 상태 확인
- `GET /api/leaderboard/:guildId` - 서버 리더보드
- `GET /api/guilds` - 연결된 Discord 서버 목록

## 🚀 배포

### Vercel (웹 앱)

```bash
cd client
npm run build
# Vercel에 배포
```

### 서버 배포

```bash
npm start
```

## 📦 기술 스택

- **Backend**: Node.js, Discord.js, PostgreSQL
- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui, Discord Components v2
- **Database**: PostgreSQL
- **Scheduler**: node-cron
- **Process Manager**: PM2

## 🔧 개발

프로젝트에 기여하려면:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request