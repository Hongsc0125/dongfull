import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Trophy, 
  Clock, 
  Target, 
  Users, 
  Calendar,
  Activity,
  Star,
  Plus,
  CheckCircle,
  XCircle,
  BarChart3
} from "lucide-react"
import { auth } from "../../../../../../auth"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ScoreManagement } from "@/components/score-management"

interface Event {
  id: number
  event_name: string
  description: string
  guild_id: string
  score_type: 'points' | 'time_seconds'
  sort_direction: 'asc' | 'desc'
  score_aggregation: 'sum' | 'average' | 'best'
  is_active: boolean
  created_at: string
  creator_id: string
}

interface Participant {
  rank: number
  user_id: string
  display_name: string
  total_score?: number
  calculated_score?: number
  entry_count: number
  entries?: ScoreEntry[]
}

interface ScoreEntry {
  id: number
  score: number
  created_at: string
  added_by: string
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
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3777'}/api/user/guilds`, {
      cache: 'no-store'
    })
    if (!response.ok) return null
    
    const guilds = await response.json()
    return guilds.find((g: Guild) => g.id === guildId) || null
  } catch {
    return null
  }
}

async function getEventInfo(eventId: string): Promise<Event | null> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/event/${eventId}`, {
      cache: 'no-store'
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function getLeaderboard(eventId: string): Promise<Participant[]> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/leaderboard/${eventId}`, {
      cache: 'no-store'
    })
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}

function getRankEmoji(rank: number) {
  switch (rank) {
    case 1: return '🥇'
    case 2: return '🥈'
    case 3: return '🥉'
    default: return '🏅'
  }
}

function formatScore(score: number | undefined, scoreType: string) {
  if (score === undefined) return '0점'
  
  const numScore = parseFloat(score.toString())
  switch (scoreType) {
    case 'time_seconds':
      const totalSeconds = Math.round(numScore)
      if (totalSeconds < 60) {
        return `${totalSeconds}초`
      } else if (totalSeconds < 3600) {
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`
      } else {
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        let result = `${hours}시간`
        if (minutes > 0) result += ` ${minutes}분`
        if (seconds > 0) result += ` ${seconds}초`
        return result
      }
    case 'points':
    default:
      return `${numScore}점`
  }
}

function getScoreTypeDisplay(scoreType: string) {
  switch (scoreType) {
    case 'points':
      return { label: '포인트', icon: Target, color: 'text-blue-600' }
    case 'time_seconds':
      return { label: '시간', icon: Clock, color: 'text-green-600' }
    default:
      return { label: '포인트', icon: Target, color: 'text-blue-600' }
  }
}

function getAggregationDisplay(aggregation: string) {
  switch (aggregation) {
    case 'sum':
      return { label: '총합', icon: Plus, description: '모든 점수를 합산합니다' }
    case 'average':
      return { label: '평균', icon: Activity, description: '점수들의 평균을 계산합니다' }
    case 'best':
      return { label: '베스트', icon: Star, description: '가장 좋은 점수만 반영합니다' }
    default:
      return { label: '총합', icon: Plus, description: '모든 점수를 합산합니다' }
  }
}

function isAdmin(guild: Guild) {
  const permissions = parseInt(guild.permissions)
  return (permissions & 0x8) === 0x8 || guild.owner
}

export default async function EventDetailPage({ 
  params 
}: { 
  params: { guildId: string; eventId: string } 
}) {
  const session = await auth()
  if (!session) {
    redirect('/')
  }

  const [guild, event, leaderboard] = await Promise.all([
    getGuildInfo(params.guildId),
    getEventInfo(params.eventId),
    getLeaderboard(params.eventId)
  ])

  if (!guild || !event) {
    notFound()
  }

  const userIsAdmin = isAdmin(guild)
  const scoreTypeInfo = getScoreTypeDisplay(event.score_type)
  const aggregationInfo = getAggregationDisplay(event.score_aggregation)
  const ScoreIcon = scoreTypeInfo.icon
  const AggIcon = aggregationInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/guild/${params.guildId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              서버로 돌아가기
            </Button>
          </Link>
        </div>

        {/* Event Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${event.is_active ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                <ScoreIcon className={`h-8 w-8 ${scoreTypeInfo.color}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {event.event_name}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  {event.is_active ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      진행 중
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-600 text-white">
                      <XCircle className="mr-1 h-3 w-3" />
                      종료됨
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <ScoreIcon className="mr-1 h-3 w-3" />
                    {scoreTypeInfo.label}
                  </Badge>
                  <Badge variant="outline">
                    <AggIcon className="mr-1 h-3 w-3" />
                    {aggregationInfo.label}
                  </Badge>
                </div>
              </div>
            </div>
            
            {userIsAdmin && (
              <div className="flex gap-2">
                <ScoreManagement event={event} userIsAdmin={userIsAdmin} />
                <Button variant="outline" disabled>
                  이벤트 관리
                </Button>
              </div>
            )}
          </div>

          {event.description && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <p className="text-gray-700 dark:text-gray-300">{event.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Event Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">참가자 수</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaderboard.length}</div>
                <p className="text-xs text-muted-foreground">
                  이벤트에 참여한 사용자
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 기록 수</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leaderboard.reduce((sum, p) => sum + p.entry_count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  전체 점수 제출 횟수
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">집계 방식</CardTitle>
                <AggIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{aggregationInfo.label}</div>
                <p className="text-xs text-muted-foreground">
                  {aggregationInfo.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">생성일</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(event.created_at).toLocaleDateString('ko-KR', { 
                    month: 'numeric', 
                    day: 'numeric' 
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleDateString('ko-KR')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  리더보드
                </CardTitle>
                <CardDescription>
                  {event.is_active ? '현재 순위' : '최종 순위'} (총 {leaderboard.length}명 참가)
                </CardDescription>
              </div>
              {userIsAdmin && event.is_active && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Discord에서 <code>/점수추가</code>로 점수를 추가할 수 있습니다
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  아직 참가자가 없습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  관리자가 점수를 추가하면 여기에 표시됩니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((participant, index) => {
                  const displayScore = participant.calculated_score !== undefined ? 
                    participant.calculated_score : participant.total_score
                  
                  return (
                    <div 
                      key={participant.user_id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        participant.rank <= 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getRankEmoji(participant.rank)}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">
                              {participant.rank}위
                            </span>
                            {participant.rank <= 3 && (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                TOP 3
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {participant.display_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {participant.entry_count}회 기록
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatScore(displayScore, event.score_type)}
                        </div>
                        {event.score_aggregation !== 'best' && participant.entry_count > 1 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {aggregationInfo.label} 점수
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discord Commands Info */}
        {userIsAdmin && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>🎮 Discord 명령어</CardTitle>
              <CardDescription>
                Discord에서 이벤트를 관리하는 명령어들
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <code className="text-sm font-mono text-blue-600">/점수추가</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    이벤트: {event.event_name}<br />
                    사용자를 선택하고 점수를 입력하세요
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <code className="text-sm font-mono text-green-600">/순위</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Discord에서 현재 순위를 확인할 수 있습니다
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <code className="text-sm font-mono text-purple-600">/이벤트정보</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    이벤트의 상세 정보와 설정을 확인합니다
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <code className="text-sm font-mono text-orange-600">/이벤트토글</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    이벤트를 활성화하거나 비활성화합니다
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