import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Server, Users, LogOut, Crown, Settings } from "lucide-react"
import { auth, signOut } from "../../../auth"
import { redirect } from "next/navigation"
import Link from "next/link"

interface Guild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
}

async function getUserGuilds(): Promise<Guild[]> {
  try {
    const { headers } = await import('next/headers')
    const headersList = headers()
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3777'}/api/user/guilds`, {
      cache: 'no-store',
      headers: {
        cookie: headersList.get('cookie') || '',
      },
    })
    if (!response.ok) throw new Error('Failed to fetch guilds')
    return await response.json()
  } catch (error) {
    console.error('Error fetching user guilds:', error)
    return []
  }
}

export default async function Dashboard() {
  const session = await auth()

  console.log('Dashboard session debug:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    hasAccessToken: !!session?.accessToken,
    userName: session?.user?.name,
    userImage: session?.user?.image
  })

  if (!session || !session.user) {
    redirect('/')
  }

  const guilds = await getUserGuilds()

  const getGuildIconUrl = (guild: Guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
    }
    return null
  }

  const isAdmin = (guild: Guild) => {
    const permissions = parseInt(guild.permissions)
    return (permissions & 0x8) === 0x8 || guild.owner // ADMINISTRATOR permission
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={session.user?.image || ''} />
              <AvatarFallback>{session.user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                안녕하세요, {session.user?.name || '사용자'}님!
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Event Board 대시보드
              </p>
            </div>
          </div>
          
          <form action={async () => {
            "use server"
            await signOut()
          }}>
            <Button variant="outline" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </form>
        </div>

        {/* Guild Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 서버</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guilds.length}</div>
              <p className="text-xs text-muted-foreground">
                봇이 설치된 서버
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">관리자 서버</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {guilds.filter(guild => isAdmin(guild)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                관리 권한이 있는 서버
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">일반 서버</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {guilds.filter(guild => !isAdmin(guild)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                일반 참여자로 있는 서버
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Server List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              서버 목록
            </CardTitle>
            <CardDescription>
              Event Board 봇이 설치된 서버들입니다. 서버를 클릭하여 이벤트를 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {guilds.length === 0 ? (
              <div className="text-center py-12">
                <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  봇이 설치된 서버가 없습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Event Board 봇을 Discord 서버에 초대해보세요
                </p>
                <Button className="bg-[#5865F2] hover:bg-[#4752C4]">
                  봇 초대하기
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {guilds.map((guild) => (
                  <Link key={guild.id} href={`/guild/${guild.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={getGuildIconUrl(guild) || ''} />
                            <AvatarFallback>
                              {guild.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {guild.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {guild.owner && (
                                <Badge variant="default" className="text-xs">
                                  <Crown className="mr-1 h-3 w-3" />
                                  소유자
                                </Badge>
                              )}
                              {isAdmin(guild) && !guild.owner && (
                                <Badge variant="secondary" className="text-xs">
                                  <Settings className="mr-1 h-3 w-3" />
                                  관리자
                                </Badge>
                              )}
                              {!isAdmin(guild) && (
                                <Badge variant="outline" className="text-xs">
                                  <Users className="mr-1 h-3 w-3" />
                                  멤버
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>💡 도움말</CardTitle>
              <CardDescription>
                Event Board 사용법 및 문의사항
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">📖 사용법</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Discord에서 슬래시 명령어를 사용하여 이벤트를 관리할 수 있습니다.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <code>/이벤트생성</code> - 새 이벤트 생성</li>
                    <li>• <code>/점수추가</code> - 점수 추가 (관리자)</li>
                    <li>• <code>/순위</code> - 리더보드 확인</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">🔧 문의사항</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    버그 신고나 기능 요청이 있으시면 연락해주세요.
                  </p>
                  <Button variant="outline" size="sm">
                    GitHub Issues
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}