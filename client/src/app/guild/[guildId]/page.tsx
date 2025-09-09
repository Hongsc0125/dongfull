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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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

        {/* Guild Info */}
        <div className="flex items-center gap-6 mb-8">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                활성 이벤트
              </CardTitle>
              <CardDescription>
                현재 진행 중인 이벤트들입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeEvents.map((event) => {
                  const scoreType = getScoreTypeDisplay(event.score_type)
                  const aggregation = getAggregationDisplay(event.score_aggregation)
                  const ScoreIcon = scoreType.icon
                  const AggIcon = aggregation.icon

                  return (
                    <Link key={event.id} href={`/guild/${resolvedParams.guildId}/event/${event.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                              {event.event_name}
                            </h3>
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              활성
                            </Badge>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <ScoreIcon className={`h-4 w-4 ${scoreType.color}`} />
                              <span>{scoreType.label}</span>
                              <span className="text-gray-400">•</span>
                              <AggIcon className="h-4 w-4 text-gray-600" />
                              <span>{aggregation.label}</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{event.participantCount}명 참가</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4" />
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
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                비활성 이벤트
              </CardTitle>
              <CardDescription>
                종료된 이벤트들입니다. 기록은 계속 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveEvents.map((event) => {
                  const scoreType = getScoreTypeDisplay(event.score_type)
                  const aggregation = getAggregationDisplay(event.score_aggregation)
                  const ScoreIcon = scoreType.icon
                  const AggIcon = aggregation.icon

                  return (
                    <Link key={event.id} href={`/guild/${resolvedParams.guildId}/event/${event.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500 opacity-75">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                              {event.event_name}
                            </h3>
                            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              종료
                            </Badge>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <ScoreIcon className={`h-4 w-4 ${scoreType.color}`} />
                              <span>{scoreType.label}</span>
                              <span className="text-gray-400">•</span>
                              <AggIcon className="h-4 w-4 text-gray-600" />
                              <span>{aggregation.label}</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{event.participantCount}명 참가</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4" />
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
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  아직 이벤트가 없습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Discord에서 <code>/이벤트생성</code> 명령어를 사용하여 첫 이벤트를 만들어보세요
                </p>
                <Badge variant="outline" className="text-sm">
                  관리자만 이벤트를 생성할 수 있습니다
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        {isAdmin(guild) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>🛠️ 관리자 기능</CardTitle>
              <CardDescription>
                Discord에서 사용할 수 있는 관리자 명령어들
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <code className="text-sm font-mono text-blue-600">/이벤트생성</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    새로운 랭킹 이벤트를 생성합니다
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <code className="text-sm font-mono text-green-600">/점수추가</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    참가자에게 점수를 추가합니다
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <code className="text-sm font-mono text-purple-600">/이벤트토글</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    이벤트를 활성화하거나 비활성화합니다
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <code className="text-sm font-mono text-orange-600">/이벤트정보</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    이벤트의 상세 정보를 확인합니다
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}