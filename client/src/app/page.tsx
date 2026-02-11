import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, Users, Trophy, Bot, LogIn, Server, Calendar } from "lucide-react"
import { auth, signIn } from "../../auth"
import { redirect } from "next/navigation"

async function getBotStats() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3777'}/api/bot/stats`, {
      cache: 'no-store'
    })
    if (!response.ok) throw new Error('Failed to fetch stats')
    return await response.json()
  } catch (error) {
    console.error('Error fetching bot stats:', error)
    return {
      isOnline: false,
      guildCount: 0,
      totalEvents: 0,
      totalParticipants: 0,
      uptime: '알 수 없음'
    }
  }
}

export default async function Home() {
  const session = await auth()
  const stats = await getBotStats()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile Header */}
        <div className="block sm:hidden text-center mb-6 px-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bot className="h-9 w-9 text-blue-600" />
            <h1 className="text-2xl font-bold text-foreground">Event Board</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6 px-2 leading-relaxed">
            Discord 이벤트 관리 및 랭킹 시스템
          </p>

          {/* Mobile Login Button */}
          <div className="px-4">
            <form action={async () => {
              "use server"
              await signIn("discord")
            }}>
              <Button
                type="submit"
                size="lg"
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white w-full px-6 py-4 text-base"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Discord로 로그인
              </Button>
            </form>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:block text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="h-12 w-12 text-blue-600" />
            <h1 className="text-5xl font-bold text-foreground">Event Board</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Discord 이벤트 관리 및 랭킹 시스템
          </p>
          
          {/* Login Button */}
          <form action={async () => {
            "use server"
            await signIn("discord")
          }}>
            <Button 
              type="submit"
              size="lg" 
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 text-lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Discord로 로그인
            </Button>
          </form>
        </div>

        {/* Mobile Status Cards */}
        <div className="block sm:hidden px-2 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-center">
                <Activity className={`h-6 w-6 mx-auto mb-2 ${stats.isOnline ? 'text-green-600' : 'text-red-600'}`} />
                <div className={`text-base font-bold ${stats.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.isOnline ? '온라인' : '오프라인'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">봇 상태</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <Server className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-base font-bold">{stats.guildCount}</div>
                <p className="text-xs text-muted-foreground mt-1">연결된 서버</p>
              </div>
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Card className="p-4">
              <div className="text-center">
                <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-base font-bold">{stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground mt-1">총 이벤트</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <Trophy className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-base font-bold">{stats.totalParticipants}</div>
                <p className="text-xs text-muted-foreground mt-1">참가자</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Desktop Status Cards */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">봇 상태</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {stats.isOnline ? '온라인' : '오프라인'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.isOnline ? '모든 시스템 정상 작동' : '봇이 오프라인 상태입니다'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">연결된 서버</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.guildCount}</div>
              <p className="text-xs text-muted-foreground">
                활성화된 Discord 서버
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 이벤트</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                생성된 이벤트 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">참가자</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                이벤트 참여자 수
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Features */}
        <div className="block sm:hidden px-2 space-y-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🎯 주요 기능</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm">이벤트 생성 시스템</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm">실시간 점수 및 랭킹</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm">다양한 집계 방식</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm">시간/점수 기반 이벤트</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🚀 시작하기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">1. Discord 로그인</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Discord 계정으로 로그인하여 가입된 서버를 확인하세요
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">2. 서버 선택</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  봇이 설치된 서버를 선택하여 이벤트를 확인하세요
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">3. 이벤트 관리</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  관리자라면 점수 추가 등의 관리 기능을 사용할 수 있습니다
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Features */}
        <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>🎯 주요 기능</CardTitle>
              <CardDescription>
                Event Board가 제공하는 핵심 기능들
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>모달 기반 이벤트 생성 시스템</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>실시간 점수 추가 및 랭킹</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>다양한 집계 방식 (합산/평균/베스트)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>시간/점수 기반 이벤트 지원</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Discord Components v2 디자인</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🚀 시작하기</CardTitle>
              <CardDescription>
                Discord로 로그인하여 이벤트를 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold mb-2">1. Discord 로그인</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Discord 계정으로 로그인하여 가입된 서버를 확인하세요
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-semibold mb-2">2. 서버 선택</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  봇이 설치된 서버를 선택하여 이벤트를 확인하세요
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-semibold mb-2">3. 이벤트 관리</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  관리자라면 점수 추가 등의 관리 기능을 사용할 수 있습니다
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Commands */}
        <div className="block sm:hidden px-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🤖 봇 명령어</CardTitle>
              <CardDescription className="text-sm">
                Discord에서 사용할 수 있는 슬래시 명령어들
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <code className="text-sm font-mono text-blue-600 font-semibold">/이벤트생성</code>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    새로운 이벤트를 생성합니다 (관리자)
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <code className="text-sm font-mono text-blue-600 font-semibold">/점수추가</code>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    참가자에게 점수를 추가합니다 (관리자)
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <code className="text-sm font-mono text-blue-600 font-semibold">/순위</code>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    이벤트 리더보드를 확인합니다
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <code className="text-sm font-mono text-blue-600 font-semibold">/이벤트목록</code>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    서버의 모든 이벤트 목록을 봅니다
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <code className="text-sm font-mono text-blue-600 font-semibold">/이벤트정보</code>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    특정 이벤트의 상세 정보를 봅니다
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <code className="text-sm font-mono text-blue-600 font-semibold">/이벤트토글</code>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    이벤트를 활성화/비활성화 (관리자)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Commands */}
        <Card className="hidden sm:block">
          <CardHeader>
            <CardTitle>🤖 봇 명령어 (한국어)</CardTitle>
            <CardDescription>
              Discord에서 사용할 수 있는 슬래시 명령어들
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <code className="text-sm font-mono text-blue-600">/이벤트생성</code>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  새로운 이벤트를 생성합니다 (관리자)
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <code className="text-sm font-mono text-blue-600">/점수추가</code>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  참가자에게 점수를 추가합니다 (관리자)
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <code className="text-sm font-mono text-blue-600">/순위</code>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  이벤트 리더보드를 확인합니다
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <code className="text-sm font-mono text-blue-600">/이벤트목록</code>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  서버의 모든 이벤트 목록을 봅니다
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <code className="text-sm font-mono text-blue-600">/이벤트정보</code>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  특정 이벤트의 상세 정보를 봅니다
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <code className="text-sm font-mono text-blue-600">/이벤트토글</code>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  이벤트를 활성화/비활성화 (관리자)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}