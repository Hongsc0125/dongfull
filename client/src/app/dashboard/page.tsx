import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Server, Users, LogOut, Crown, Settings } from "lucide-react"
import { auth, signOut } from "../../../auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { RefreshButton } from "@/components/refresh-button"

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
    const headersList = await headers()

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3777'}/api/user/guilds`, {
      cache: 'no-store',
      headers: {
        cookie: headersList.get('cookie') || '',
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.log('Rate limited, returning empty guilds list')
        return []
      }
      throw new Error(`Failed to fetch guilds: ${response.status}`)
    }

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile Header */}
        <div className="block sm:hidden mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={session.user?.image || ''} />
                <AvatarFallback>{session.user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {session.user?.name || '사용자'}님
                </h1>
                <p className="text-sm text-muted-foreground">
                  Event Board
                </p>
              </div>
            </div>

            <form action={async () => {
              "use server"
              await signOut()
            }}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between mb-8">
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

        {/* Mobile Stats */}
        <div className="block sm:hidden mb-6">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3">
              <div className="text-center">
                <Server className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-lg font-bold">{guilds.length}</div>
                <p className="text-xs text-muted-foreground">총 서버</p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <Crown className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-lg font-bold">
                  {guilds.filter(guild => isAdmin(guild)).length}
                </div>
                <p className="text-xs text-muted-foreground">관리자</p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-lg font-bold">
                  {guilds.filter(guild => !isAdmin(guild)).length}
                </div>
                <p className="text-xs text-muted-foreground">일반</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Desktop Stats */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Mobile Server List */}
        <div className="block sm:hidden">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              서버 목록
            </h2>
            <p className="text-sm text-muted-foreground">
              서버를 터치하여 이벤트를 확인하세요
            </p>
          </div>

          {guilds.length === 0 ? (
            <Card className="p-6">
              <div className="text-center">
                <Server className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  서버 정보 로딩 중
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Discord API 요청이 많아 잠시 지연될 수 있습니다
                </p>
                <RefreshButton className="bg-[#5865F2] hover:bg-[#4752C4] w-full">
                  새로고침
                </RefreshButton>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {guilds.map((guild) => (
                <Link key={guild.id} href={`/guild/${guild.id}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer active:scale-95">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={getGuildIconUrl(guild) || ''} />
                          <AvatarFallback>
                            {guild.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {guild.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-1 overflow-hidden">
                            {guild.owner && (
                              <Badge variant="default" className="text-xs px-1">
                                <Crown className="h-3 w-3" />
                              </Badge>
                            )}
                            {isAdmin(guild) && !guild.owner && (
                              <Badge variant="secondary" className="text-xs px-1">
                                <Settings className="h-3 w-3" />
                              </Badge>
                            )}
                            {!isAdmin(guild) && (
                              <Badge variant="outline" className="text-xs px-1">
                                <Users className="h-3 w-3" />
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
        </div>

        {/* Desktop Server List */}
        <Card className="hidden sm:block">
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
                <h3 className="text-lg font-medium text-foreground mb-2">
                  서버 정보를 불러오는 중입니다
                </h3>
                <p className="text-muted-foreground mb-4">
                  Discord API 요청이 많아 잠시 지연될 수 있습니다. 페이지를 새로고침해주세요.
                </p>
                <RefreshButton className="bg-[#5865F2] hover:bg-[#4752C4]">
                  새로고침
                </RefreshButton>
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
                            <h3 className="font-medium text-foreground truncate">
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
      </div>
    </div>
  )
}