# 🏆 Event Board

Discord 서버를 위한 종합적인 이벤트 관리 및 랭킹 시스템입니다.

Discord 봇과 웹 대시보드를 통해 커뮤니티 이벤트를 쉽게 관리하고, 실시간으로 순위를 추적할 수 있습니다.

## ✨ 주요 기능

### 🤖 Discord 봇
- **한국어 슬래시 명령어**: 직관적인 한국어 명령어로 이벤트 관리
- **실시간 상호작용**: Discord에서 바로 점수 추가 및 순위 확인
- **권한 관리**: 관리자 전용 기능과 일반 사용자 기능 분리
- **임베드 메시지**: 아름다운 형태의 리더보드 및 정보 표시

### 🌐 웹 대시보드
- **Discord OAuth 로그인**: 간편한 Discord 계정 연동
- **실시간 업데이트**: 자동 새로고침으로 최신 데이터 표시
- **직관적인 UI**: shadcn/ui 기반의 모던하고 반응형 인터페이스
- **종합 관리**: 이벤트, 참가자, 점수 기록의 완전한 CRUD 관리

### 📊 이벤트 시스템
- **다양한 점수 타입**: 포인트 기반 또는 시간 기반 경쟁
- **유연한 집계 방식**: 합산/평균/베스트 스코어 중 선택
- **정렬 옵션**: 높은 점수 우선 또는 낮은 점수 우선 설정
- **활성화 관리**: 이벤트 시작/종료 상태 관리

### 💾 고급 데이터 관리
- **점수 기록 이력**: 모든 점수 변경 사항 추적
- **멤버 자동 동기화**: Discord 서버 멤버 정보 자동 캐싱
- **안전한 삭제**: 강력한 확인 절차를 통한 데이터 삭제
- **공개 랭킹**: 로그인 없이 접근 가능한 공개 순위표

## 📁 프로젝트 구조

```
dongfull/
├── src/                          # Backend (Node.js + Discord.js)
│   ├── bot/                      # Discord 봇
│   │   ├── index.js              # 봇 메인 엔트리포인트
│   │   └── commands/             # 한국어 슬래시 명령어들
│   │       ├── add-score.js      # 점수 추가 (/점수추가)
│   │       ├── create-event.js   # 이벤트 생성 (/이벤트생성)
│   │       ├── event-info.js     # 이벤트 정보 (/이벤트정보)
│   │       ├── event-list.js     # 이벤트 목록 (/이벤트목록)
│   │       ├── leaderboard.js    # 리더보드 (/순위)
│   │       └── toggle-event.js   # 이벤트 토글 (/이벤트토글)
│   ├── server/                   # Express.js API 서버
│   │   ├── index.js              # 서버 메인 엔트리포인트
│   │   └── routes/               # API 라우트 모듈들
│   ├── database/                 # PostgreSQL 데이터베이스 레이어
│   │   ├── init.js               # 스키마 초기화 및 마이그레이션
│   │   ├── events.js             # 이벤트 CRUD 관리
│   │   ├── participants.js       # 참가자 및 점수 관리
│   │   ├── guilds.js             # 길드 정보 관리
│   │   └── guild-members.js      # 멤버 캐싱 시스템
│   ├── scheduler/                # 백그라운드 작업 스케줄러
│   ├── config/                   # 설정 파일들
│   └── utils/                    # 유틸리티 함수들
├── client/                       # Frontend (Next.js 15)
│   ├── src/
│   │   ├── app/                  # App Router 구조
│   │   │   ├── api/              # API 라우트 핸들러들
│   │   │   ├── dashboard/        # 메인 대시보드 페이지
│   │   │   ├── guild/[guildId]/  # 길드별 관리 페이지
│   │   │   └── public/           # 공개 랭킹 페이지
│   │   ├── components/           # React 컴포넌트들
│   │   │   ├── ui/               # shadcn/ui 기본 컴포넌트
│   │   │   ├── enhanced-score-management-v2.tsx
│   │   │   ├── event-edit-dialog.tsx
│   │   │   ├── leaderboard-with-modal.tsx
│   │   │   └── real-time-event-detail.tsx
│   │   ├── hooks/                # 커스텀 React 훅들
│   │   ├── types/                # TypeScript 타입 정의
│   │   └── utils/                # 클라이언트 유틸리티
│   ├── public/                   # 정적 파일들 (이미지, 아이콘)
│   └── auth.ts                   # NextAuth Discord OAuth 설정
├── ecosystem.config.js           # PM2 프로세스 관리 설정
├── start.sh / stop.sh           # 서비스 시작/중지 스크립트
├── package.json                 # 루트 의존성 (봇 + 서버)
└── client/package.json          # 클라이언트 의존성
```

## 🚀 빠른 시작

### 1. 사전 요구 사항

- **Node.js 18+** - JavaScript 런타임
- **PostgreSQL 13+** - 메인 데이터베이스
- **Discord Bot Token** - Discord Developer Portal에서 생성
- **Discord Application** - OAuth2 설정 포함

### 2. 의존성 설치

```bash
# 루트와 클라이언트 모든 의존성 설치
npm run install:all

# 또는 개별 설치
npm install                    # 백엔드 의존성
cd client && npm install       # 프론트엔드 의존성
```

### 3. 환경 변수 설정

루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 설정하세요:

```bash
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Server Configuration  
PORT=3001
NODE_ENV=development

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3777
NEXTAUTH_SECRET=your_32_character_random_secret

# API URLs
BACKEND_URL=http://localhost:3001

# Database (PostgreSQL)
DATABASE_NAME=event_board
DATABASE_URL=localhost:5432      # host:port 형태
DB_PW=your_database_password
DB_USER=your_database_user
```

### 4. Discord 봇 명령어 배포

```bash
# Discord에 슬래시 명령어 등록
npm run deploy-commands
```

### 5. 애플리케이션 실행

**🎯 원클릭 시작 (권장)**
```bash
./start.sh
# 또는 Windows 환경에서
npm run dev
```

**개별 실행 (개발용)**
```bash
npm run server:dev  # Discord 봇 + API 서버 (포트 3001)
npm run client:dev  # Next.js 웹 앱 (포트 3777)
npm run bot         # Discord 봇만 실행
```

**⏹️ 애플리케이션 중지**
```bash
./stop.sh
```

### 6. 접속 정보

- 🌐 **웹 대시보드**: http://localhost:3777
- 🔌 **API 서버**: http://localhost:3001  
- 📊 **서버 상태**: http://localhost:3001/api/health
- 🤖 **봇 상태**: http://localhost:3001/api/bot/status

## 🤖 Discord 봇 명령어

모든 명령어는 한국어로 제공되며, 직관적인 인터페이스를 제공합니다.

### 관리자 전용 명령어
- `/이벤트생성` - 새로운 랭킹 이벤트 생성
  - 이벤트명, 설명, 점수 타입, 집계 방식 설정 가능
- `/점수추가` - 참가자에게 점수 추가 또는 편집
  - 멤버 검색, 점수 입력, 메모 추가 기능
- `/이벤트토글` - 이벤트 활성화/비활성화 토글

### 모든 사용자 명령어  
- `/순위` - 이벤트 리더보드 확인
  - 실시간 순위와 점수 표시
- `/이벤트목록` - 서버의 모든 이벤트 목록 조회
- `/이벤트정보` - 특정 이벤트의 상세 정보 확인
  - 이벤트 설정, 참가자 수, 통계 정보 포함

## 🌐 웹 대시보드 기능

### 🔐 인증 및 권한
- **Discord OAuth 로그인**: 원클릭 Discord 계정 연동
- **자동 권한 감지**: Discord 서버 관리자 권한 자동 확인
- **안전한 세션 관리**: NextAuth.js 기반 보안 인증

### 📊 이벤트 관리
- **이벤트 생성**: 웹에서 직접 이벤트 생성 및 설정
- **실시간 편집**: 이벤트 정보 실시간 수정
- **안전한 삭제**: 강력한 확인 절차를 통한 이벤트 삭제
- **활성화 관리**: 원클릭 이벤트 시작/중지

### 👥 참가자 및 점수 관리
- **멤버 검색**: 실시간 Discord 멤버 검색 및 자동완성
- **점수 추가**: 직관적인 인터페이스로 점수 입력
- **기록 편집**: 개별 점수 기록 수정 및 삭제
- **히스토리 추적**: 모든 점수 변경 사항 이력 관리

### 📈 실시간 리더보드
- **자동 업데이트**: 10초마다 자동 데이터 새로고침
- **다양한 집계**: 합산/평균/베스트 점수 방식 지원
- **정렬 옵션**: 높은/낮은 점수 우선 설정
- **상세 정보**: 각 참가자의 기록 이력 확인

### 🌍 공개 랭킹
- **로그인 불필요**: 누구나 접근 가능한 공개 순위표
- **소셜 공유**: 랭킹 결과 쉬운 공유 기능
- **반응형 디자인**: 모바일 친화적 인터페이스

## 🔌 API 엔드포인트

### 서버 상태
- `GET /api/health` - 서버 건강 상태 확인
- `GET /api/bot/status` - Discord 봇 연결 상태

### 이벤트 관리
- `GET /api/events/:guildId` - 길드별 이벤트 목록
- `GET /api/event/:eventId` - 특정 이벤트 정보
- `POST /api/events` - 새 이벤트 생성
- `PUT /api/events/:eventId` - 이벤트 정보 수정
- `DELETE /api/events/:eventId` - 이벤트 삭제
- `PATCH /api/events/:eventId/toggle` - 이벤트 활성화/비활성화

### 참가자 및 점수
- `GET /api/leaderboard/:eventId` - 이벤트 리더보드
- `POST /api/participants` - 참가자 추가
- `GET /api/participants/history` - 참가자 기록 히스토리
- `POST /api/participants/:participantId/score` - 점수 추가

### 점수 기록 관리
- `GET /api/score-entries/:entryId` - 특정 점수 기록 조회
- `PUT /api/score-entries/:entryId` - 점수 기록 수정
- `DELETE /api/score-entries/:entryId` - 점수 기록 삭제

### 길드 관리
- `GET /api/guilds` - 연결된 Discord 서버 목록
- `GET /api/guild/:guildId/members` - 길드 멤버 목록 및 검색

## 💾 데이터베이스 구조

PostgreSQL을 사용하며, 다음과 같은 테이블 구조를 가집니다:

### 주요 테이블
- **guilds**: Discord 서버 정보 및 설정
- **events**: 랭킹 이벤트 (점수 타입, 집계 방식, 정렬 방향)
- **participants**: 이벤트 참가자 및 집계된 점수
- **score_entries**: 개별 점수 기록 및 변경 이력
- **guild_members**: 캐시된 Discord 멤버 정보

### 점수 집계 방식
- **합산 (sum)**: 모든 점수를 더하여 총점 계산
- **평균 (average)**: 모든 점수의 평균값 계산
- **베스트 (best)**: 가장 좋은 점수만 반영

## 🚀 배포

### 개발 환경
```bash
# 개발 서버 실행
npm run dev
```

### 프로덕션 환경
```bash
# 클라이언트 빌드
cd client && npm run build

# PM2를 사용한 프로덕션 실행
npm start

# 또는 직접 실행
npm run server:prod
cd client && npm run start
```

### 클라우드 배포 옵션
- **Frontend**: Vercel, Netlify, AWS Amplify
- **Backend**: AWS EC2, Digital Ocean, Heroku  
- **Database**: AWS RDS, Supabase, Railway

## 📦 기술 스택

### Backend
- **Node.js 18+** - JavaScript 런타임
- **Discord.js v14** - Discord Bot API 클라이언트
- **Express.js 4** - 웹 프레임워크
- **PostgreSQL 13+** - 관계형 데이터베이스
- **node-cron** - 스케줄링 (멤버 동기화)
- **winston** - 구조화된 로깅
- **helmet** - 보안 미들웨어

### Frontend  
- **Next.js 15** - React 풀스택 프레임워크
- **React 19** - 사용자 인터페이스 라이브러리
- **TypeScript 5** - 정적 타입 체크
- **Tailwind CSS 4** - 유틸리티 우선 CSS 프레임워크
- **shadcn/ui** - 재사용 가능한 UI 컴포넌트
- **NextAuth.js** - 인증 라이브러리 (Discord OAuth)
- **Radix UI** - 접근성 기반 프리미티브 컴포넌트

### DevOps & Tools
- **PM2** - 프로덕션 프로세스 관리
- **ESLint** - 코드 품질 및 스타일 검사
- **Prettier** - 코드 포매팅
- **concurrently** - 다중 프로세스 실행

## 🔧 개발 가이드

### 코드 구조
```bash
# 새로운 Discord 명령어 추가
src/bot/commands/new-command.js

# 새로운 API 엔드포인트 추가  
src/server/routes/new-route.js

# 새로운 React 컴포넌트 추가
client/src/components/new-component.tsx

# 데이터베이스 함수 추가
src/database/new-functions.js
```

### 개발 규칙
- **커밋 메시지**: 한국어로 명확하게 작성
- **타입 안전성**: TypeScript 활용으로 런타임 에러 방지
- **컴포넌트**: 재사용 가능한 모듈화된 구조
- **API**: RESTful 설계 원칙 준수

### 기여 방법
1. Repository Fork
2. Feature branch 생성: `git checkout -b feature/new-feature`
3. 변경사항 커밋: `git commit -m "feat: 새로운 기능 추가"`
4. Branch Push: `git push origin feature/new-feature`
5. Pull Request 생성

## 📞 지원 및 문의

- **이슈 리포트**: GitHub Issues
- **기능 요청**: GitHub Discussions
- **보안 문제**: 별도 연락

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.