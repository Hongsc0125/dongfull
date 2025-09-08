# Rank Bot Project

Discord 랭킹 봇과 웹 대시보드를 결합한 프로젝트입니다.

## 🚀 기능

- **Discord 봇**: 사용자 경험치 및 레벨 시스템
- **웹 대시보드**: Next.js + shadcn/ui로 구축된 관리 인터페이스
- **실시간 리더보드**: 서버별 랭킹 시스템
- **REST API**: 봇과 웹 간 데이터 연동

## 📁 프로젝트 구조

```
├── src/
│   ├── bot/              # Discord 봇 관련 코드
│   │   ├── index.js      # 봇 메인 엔트리
│   │   └── commands/     # 봇 명령어
│   ├── server/           # Express API 서버
│   │   └── index.js      # API 엔트리
│   └── database/         # SQLite 데이터베이스
│       ├── init.js       # DB 초기화
│       └── users.js      # 사용자 관련 쿼리
├── client/               # Next.js 웹 앱
│   └── src/
│       └── app/          # App Router
└── data/                 # SQLite 데이터베이스 파일
```

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
# 루트 및 클라이언트 의존성 설치
npm run install:all
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일에서 다음 값들을 설정:

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
PORT=3001
```

### 3. 개발 서버 실행

```bash
# 봇과 웹 서버를 동시에 실행
npm run dev
```

- 웹 대시보드: http://localhost:3000
- API 서버: http://localhost:3001

## 🤖 Discord 봇 명령어

- `!rank` - 자신의 랭킹 정보 확인
- `/rank` - 슬래시 명령어로 랭킹 확인

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

- **Backend**: Node.js, Express.js, Discord.js, SQLite
- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **Database**: SQLite3

## 🔧 개발

프로젝트에 기여하려면:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request