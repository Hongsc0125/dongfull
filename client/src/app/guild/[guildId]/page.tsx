import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, 
  Trophy, 
  Users, 
  ArrowLeft, 
  Plus, 
  Activity,
  Clock,
  Target,
  Crown,
  Medal,
  Star,
  CheckCircle,
  XCircle
} from "lucide-react"
import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { notFound } from "next/navigation"

interface Event {
  id: number
  event_name: string
  description: string
  score_type: 'points' | 'time_seconds'
  sort_direction: 'asc' | 'desc'
  score_aggregation: 'sum' | 'average' | 'best'
  is_active: boolean
  created_at: string
  creator_id: string
}

interface Guild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
}

async function getGuildInfo(guildId: string): Promise<Guild | null> {
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3777'}/api/user/guilds`, {
      cache: 'no-store',
      headers: {
        cookie: headersList.get('cookie') || '',
      },
    })
    if (!response.ok) return null
    
    const guilds = await response.json()
    return guilds.find((g: Guild) => g.id === guildId) || null
  } catch (error) {
    return null
  }
}

async function getGuildEvents(guildId: string): Promise<Event[]> {
  try {
    const response = await fetch(`http://localhost:3001/api/events/${guildId}`, {
      cache: 'no-store'
    })
    if (!response.ok) throw new Error('Failed to fetch events')
    return await response.json()
  } catch (error) {
    console.error('Error fetching guild events:', error)
    return []
  }
}

async function getEventParticipants(eventId: number): Promise<number> {
  try {
    const response = await fetch(`http://localhost:3001/api/leaderboard/${eventId}`, {
      cache: 'no-store'
    })
    if (!response.ok) return 0
    const leaderboard = await response.json()
    return leaderboard.length
  } catch (error) {
    return 0
  }
}

export default async function GuildPage({ params }: { params: Promise<{ guildId: string }> }) {
  const session = await auth()
  if (!session) {
    redirect('/')
  }

  const resolvedParams = await params
  const guild = await getGuildInfo(resolvedParams.guildId)
  if (!guild) {
    notFound()
  }

  const events = await getGuildEvents(resolvedParams.guildId)
  
  // 각 이벤트의 참가자 수 가져오기
  const eventsWithParticipants = await Promise.all(
    events.map(async (event) => ({
      ...event,
      participantCount: await getEventParticipants(event.id)
    }))
  )

  const activeEvents = eventsWithParticipants.filter(event => event.is_active)
  const inactiveEvents = eventsWithParticipants.filter(event => !event.is_active)

  const getGuildIconUrl = (guild: Guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
    }
    return null
  }

  const isAdmin = (guild: Guild) => {
    const permissions = parseInt(guild.permissions)
    return (permissions & 0x8) === 0x8 || guild.owner
  }

  const getScoreTypeDisplay = (scoreType: string) => {
    switch (scoreType) {
      case 'points':
        return { label: '포인트', icon: Target, color: 'text-blue-600' }
      case 'time_seconds':
        return { label: '시간', icon: Clock, color: 'text-green-600' }
      default:
        return { label: '포인트', icon: Target, color: 'text-blue-600' }
    }
  }

  const getAggregationDisplay = (aggregation: string) => {
    switch (aggregation) {
      case 'sum':
        return { label: '총합', icon: Plus }
      case 'average':
        return { label: '평균', icon: Activity }
      case 'best':
        return { label: '베스트', icon: Star }
      default:
        return { label: '총합', icon: Plus }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile Header */}
        <div className="block sm:hidden mb-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="px-3">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            {isAdmin(guild) && (
              <Link href={`/guild/${resolvedParams.guildId}/create-event`}>
                <Button size="sm" className="px-3">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              대시보드로 돌아가기
            </Button>
          </Link>

          {isAdmin(guild) && (
            <Link href={`/guild/${resolvedParams.guildId}/create-event`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                새 이벤트 생성
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Guild Info */}
        <div className="block sm:hidden mb-6">
          <div className="text-center mb-4">
            <Avatar className="h-16 w-16 mx-auto mb-3">
              <AvatarImage src={getGuildIconUrl(guild) || ''} />
              <AvatarFallback className="text-xl">
                {guild.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {guild.name}
            </h1>
            <div className="flex justify-center gap-2 mb-2">
              {guild.owner && (
                <Badge variant="default" className="text-xs">
                  <Crown className="mr-1 h-3 w-3" />
                  소유자
                </Badge>
              )}
              {isAdmin(guild) && !guild.owner && (
                <Badge variant="secondary" className="text-xs">
                  관리자
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              이벤트 관리 및 순위 확인
            </p>
          </div>
        </div>

        {/* Desktop Guild Info */}
        <div className="hidden sm:flex items-center gap-6 mb-8">
          <Avatar className="h-20 w-20">
            <AvatarImage src={getGuildIconUrl(guild) || ''} />
            <AvatarFallback className="text-2xl">
              {guild.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {guild.name}
              {guild.owner && (
                <Badge variant="default">
                  <Crown className="mr-1 h-3 w-3" />
                  소유자
                </Badge>
              )}
              {isAdmin(guild) && !guild.owner && (
                <Badge variant="secondary">
                  관리자
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              이벤트 관리 및 순위 확인
            </p>
          </div>
        </div>

        {/* Mobile Stats Cards */}
        <div className="block sm:hidden grid grid-cols-2 gap-3 mb-6">
          <Card className="p-3">
            <div className="text-center">
              <Calendar className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <div className="text-base font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">총 이벤트</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <div className="text-base font-bold text-green-600">{activeEvents.length}</div>
              <p className="text-xs text-muted-foreground">활성 이벤트</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <div className="text-base font-bold text-red-600">{inactiveEvents.length}</div>
              <p className="text-xs text-muted-foreground">비활성 이벤트</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <div className="text-base font-bold">
                {eventsWithParticipants.reduce((sum, event) => sum + event.participantCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">총 참가자</p>
            </div>
          </Card>
        </div>

        {/* Desktop Stats Cards */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 이벤트</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">
                생성된 이벤트 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 이벤트</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeEvents.length}</div>
              <p className="text-xs text-muted-foreground">
                진행 중인 이벤트
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">비활성 이벤트</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveEvents.length}</div>
              <p className="text-xs text-muted-foreground">
                종료된 이벤트
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 참가자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {eventsWithParticipants.reduce((sum, event) => sum + event.participantCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                전체 참가자 수
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Events */}
        {activeEvents.length > 0 && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                활성 이벤트
              </CardTitle>
              <CardDescription className="text-sm">
                현재 진행 중인 이벤트들입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {activeEvents.map((event) => {
                  const scoreType = getScoreTypeDisplay(event.score_type)
                  const aggregation = getAggregationDisplay(event.score_aggregation)
                  const ScoreIcon = scoreType.icon
                  const AggIcon = aggregation.icon

                  return (
                    <Link key={event.id} href={`/guild/${resolvedParams.guildId}/event/${event.id}`}>
                      <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-green-500 active:scale-[0.98] sm:active:scale-100">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2 pr-2">
                              {event.event_name}
                            </h3>
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 flex-shrink-0">
                              활성
                            </Badge>
                          </div>

                          {event.description && (
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                              {event.description}
                            </p>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <ScoreIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${scoreType.color}`} />
                              <span>{scoreType.label}</span>
                              <span className="text-gray-400">•</span>
                              <AggIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                              <span>{aggregation.label}</span>
                            </div>

                            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{event.participantCount}명</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>순위 보기</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inactive Events */}
        {inactiveEvents.length > 0 && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                비활성 이벤트
              </CardTitle>
              <CardDescription className="text-sm">
                종료된 이벤트들입니다. 기록은 계속 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {inactiveEvents.map((event) => {
                  const scoreType = getScoreTypeDisplay(event.score_type)
                  const aggregation = getAggregationDisplay(event.score_aggregation)
                  const ScoreIcon = scoreType.icon
                  const AggIcon = aggregation.icon

                  return (
                    <Link key={event.id} href={`/guild/${resolvedParams.guildId}/event/${event.id}`}>
                      <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-red-500 opacity-75 active:scale-[0.98] sm:active:scale-100">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2 pr-2">
                              {event.event_name}
                            </h3>
                            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs px-2 py-1 flex-shrink-0">
                              종료
                            </Badge>
                          </div>

                          {event.description && (
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                              {event.description}
                            </p>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <ScoreIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${scoreType.color}`} />
                              <span>{scoreType.label}</span>
                              <span className="text-gray-400">•</span>
                              <AggIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                              <span>{aggregation.label}</span>
                            </div>

                            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{event.participantCount}명</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>기록 보기</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <Card>
            <CardContent className="py-8 sm:py-12">
              <div className="text-center px-4">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                  아직 이벤트가 없습니다
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 leading-relaxed">
                  Discord에서 <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs sm:text-sm">/이벤트생성</code> 명령어를 사용하여 첫 이벤트를 만들어보세요
                </p>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  관리자만 이벤트를 생성할 수 있습니다
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}