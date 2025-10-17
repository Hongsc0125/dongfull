"use client"

import React, { useState, useEffect, useCallback } from "react"
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
  BarChart3,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EnhancedScoreManagement } from "@/components/enhanced-score-management-v2"
import { EventToggle } from "@/components/event-toggle"
import { LeaderboardWithModal } from "@/components/leaderboard-with-modal"
import { PublicRankingShare } from "@/components/public-ranking-share"
import { EventEditDialog } from "@/components/event-edit-dialog"

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

interface RealTimeEventDetailProps {
  guildId: string
  eventId: string
  initialEvent: Event
  initialLeaderboard: Participant[]
  initialStats: { participantCount: number, totalEntries: number }
  userIsAdmin: boolean
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

function getSortDirectionDisplay(scoreType: string, sortDirection: string) {
  const isHigherBetter = sortDirection === 'desc'
  if (scoreType === 'time_seconds') {
    return {
      label: isHigherBetter ? '높은 순' : '낮은 순',
      description: isHigherBetter ? '긴 시간이 좋음' : '짧은 시간이 좋음',
      icon: Trophy
    }
  } else {
    return {
      label: isHigherBetter ? '높은 순' : '낮은 순', 
      description: isHigherBetter ? '높은 점수가 좋음' : '낮은 점수가 좋음',
      icon: Trophy
    }
  }
}

export function RealTimeEventDetail({ 
  guildId, 
  eventId, 
  initialEvent, 
  initialLeaderboard, 
  initialStats, 
  userIsAdmin 
}: RealTimeEventDetailProps) {
  const router = useRouter()
  const [event, setEvent] = useState<Event>(initialEvent)
  const [leaderboard, setLeaderboard] = useState<Participant[]>(initialLeaderboard)
  const [stats, setStats] = useState(initialStats)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // 데이터를 가져오는 함수
  const fetchEventData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/event-detail/${eventId}/full`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEvent(data.event)
        setLeaderboard(data.leaderboard)
        setStats(data.stats)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [eventId])

  // 실시간 업데이트를 위한 폴링
  useEffect(() => {
    const interval = setInterval(fetchEventData, 10000) // 10초마다 업데이트
    return () => clearInterval(interval)
  }, [fetchEventData])

  // 수동 새로고침
  const handleManualRefresh = () => {
    fetchEventData()
  }

  // 이벤트 삭제 후 길드 페이지로 이동
  const handleEventDeleted = () => {
    router.push(`/guild/${guildId}`)
  }

  const scoreTypeInfo = getScoreTypeDisplay(event.score_type)
  const aggregationInfo = getAggregationDisplay(event.score_aggregation)
  const sortDirectionInfo = getSortDirectionDisplay(event.score_type, event.sort_direction)
  const ScoreIcon = scoreTypeInfo.icon
  const AggIcon = aggregationInfo.icon
  const SortIcon = sortDirectionInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile Header */}
        <div className="block sm:hidden mb-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Link href={`/guild/${guildId}`}>
              <Button variant="outline" size="sm" className="px-3">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="text-xs text-gray-500 text-center">
            마지막 업데이트: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between gap-4 mb-8">
          <Link href={`/guild/${guildId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              서버로 돌아가기
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <span>마지막 업데이트: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Mobile Event Info */}
        <div className="block sm:hidden mb-6">
          <div className="text-center mb-4">
            <div className={`inline-flex p-3 rounded-lg mb-3 ${event.is_active ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
              <ScoreIcon className={`h-8 w-8 ${scoreTypeInfo.color}`} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {event.event_name}
            </h1>

            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {event.is_active ? (
                <Badge variant="default" className="bg-green-600 text-xs">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  진행 중
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-600 text-white text-xs">
                  <XCircle className="mr-1 h-3 w-3" />
                  종료됨
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <ScoreIcon className="mr-1 h-3 w-3" />
                {scoreTypeInfo.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <AggIcon className="mr-1 h-3 w-3" />
                {aggregationInfo.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <SortIcon className="mr-1 h-3 w-3" />
                {sortDirectionInfo.label}
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <PublicRankingShare eventName={event.event_name} eventId={event.id} />
              {userIsAdmin && (
                <>
                  <EventEditDialog
                    event={event}
                    userIsAdmin={userIsAdmin}
                    onEventUpdated={fetchEventData}
                    onEventDeleted={handleEventDeleted}
                    hasScoreEntries={stats.totalEntries > 0}
                  />
                  <EnhancedScoreManagement event={event} userIsAdmin={userIsAdmin} onScoreAdded={fetchEventData} />
                  <EventToggle event={event} userIsAdmin={userIsAdmin} onToggle={fetchEventData} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Event Info */}
        <div className="hidden sm:block mb-8">
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
                  <Badge variant="outline">
                    <SortIcon className="mr-1 h-3 w-3" />
                    {sortDirectionInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <PublicRankingShare eventName={event.event_name} eventId={event.id} />
                {userIsAdmin && (
                  <>
                    <EventEditDialog
                      event={event}
                      userIsAdmin={userIsAdmin}
                      onEventUpdated={fetchEventData}
                      onEventDeleted={handleEventDeleted}
                      hasScoreEntries={stats.totalEntries > 0}
                    />
                    <EnhancedScoreManagement event={event} userIsAdmin={userIsAdmin} onScoreAdded={fetchEventData} />
                    <EventToggle event={event} userIsAdmin={userIsAdmin} onToggle={fetchEventData} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Description & Stats */}
        <div className="mb-6 sm:mb-8">
          {event.description && (
            <Card className="mb-4 sm:mb-6">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{event.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Mobile Event Stats */}
          <div className="block sm:hidden grid grid-cols-2 gap-3 mb-6">
            <Card className="p-3">
              <div className="text-center">
                <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-base font-bold">{stats.participantCount}</div>
                <p className="text-xs text-muted-foreground">참가자</p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <BarChart3 className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-base font-bold">{stats.totalEntries}</div>
                <p className="text-xs text-muted-foreground">총 기록</p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <AggIcon className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-base font-bold">{aggregationInfo.label}</div>
                <p className="text-xs text-muted-foreground">집계방식</p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <Calendar className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-base font-bold">
                  {new Date(event.created_at).toLocaleDateString('ko-KR', {
                    month: 'numeric',
                    day: 'numeric'
                  })}
                </div>
                <p className="text-xs text-muted-foreground">생성일</p>
              </div>
            </Card>
          </div>

          {/* Desktop Event Stats */}
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">참가자 수</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.participantCount}</div>
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
                  {stats.totalEntries}
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
                <CardTitle className="text-sm font-medium">정렬 방식</CardTitle>
                <SortIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sortDirectionInfo.label}</div>
                <p className="text-xs text-muted-foreground">
                  {sortDirectionInfo.description}
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
        <LeaderboardWithModal 
          event={event}
          leaderboard={leaderboard}
          userIsAdmin={userIsAdmin}
          onDataUpdated={fetchEventData}
        />

        {/* Mobile Discord Commands Info */}
        {/* {userIsAdmin && (
          <Card className="block sm:hidden mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🎮 Discord 명령어</CardTitle>
              <CardDescription className="text-sm">
                Discord에서 이벤트를 관리하는 명령어들
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <code className="text-sm font-mono text-blue-600 font-semibold">/점수추가</code>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    이벤트: {event.event_name}<br />
                    사용자를 선택하고 점수를 입력하세요
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <code className="text-sm font-mono text-green-600 font-semibold">/순위</code>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    Discord에서 현재 순위를 확인할 수 있습니다
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <code className="text-sm font-mono text-purple-600 font-semibold">/이벤트정보</code>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    이벤트의 상세 정보와 설정을 확인합니다
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <code className="text-sm font-mono text-orange-600 font-semibold">/이벤트토글</code>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    이벤트를 활성화하거나 비활성화합니다
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Desktop Discord Commands Info */}
        {/* {userIsAdmin && (
          <Card className="hidden sm:block mt-8">
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
        )} */}
      </div>
    </div>
  )
}