"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Crown, Medal, Target, Clock, Zap, Star, Calendar, Users, BarChart3, Sparkles, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { ShareButton } from "./share-button"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { InlineLoading } from "@/components/ui/loading-spinner"

interface Event {
  id: number
  event_name: string
  description: string
  score_type: 'points' | 'time_seconds'
  sort_direction: 'asc' | 'desc'
  score_aggregation: 'sum' | 'average' | 'best'
  is_active: boolean
  created_at: string
  guild_name?: string
}

interface Participant {
  rank: number
  display_name: string
  total_score?: number
  calculated_score?: number
  entry_count: number
  avatar_url?: string
  user_id?: string
}

interface RealTimePublicLeaderboardProps {
  eventId: string
  initialEvent: Event
  initialLeaderboard: Participant[]
  initialStats: { participantCount: number, totalEntries: number }
}

function formatScore(score: number | undefined, scoreType: string, isAverage: boolean = false) {
  if (score === undefined) return '0점'
  
  const numScore = parseFloat(score.toString())
  switch (scoreType) {
    case 'time_seconds':
      if (isAverage) {
        return `${numScore.toFixed(2)}초`
      }
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
      return isAverage ? `${numScore.toFixed(2)}점` : `${numScore}점`
  }
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1: return <Crown className="h-8 w-8 text-yellow-500" />
    case 2: return <Medal className="h-7 w-7 text-gray-400" />
    case 3: return <Medal className="h-6 w-6 text-amber-600" />
    default: return <Trophy className="h-5 w-5 text-slate-500" />
  }
}

function getAggregationInfo(aggregation: string) {
  switch (aggregation) {
    case 'sum': return { label: '총합', icon: BarChart3 }
    case 'average': return { label: '평균', icon: Target }
    case 'best': return { label: '베스트', icon: Star }
    default: return { label: '총합', icon: BarChart3 }
  }
}

function DiscordAvatar({ participant, size = "md" }: { participant: Participant, size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-24 h-24"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl"
  }

  if (participant.avatar_url) {
    return (
      <img
        src={participant.avatar_url}
        alt={`${participant.display_name} avatar`}
        className={`${sizeClasses[size]} rounded-full border-2 border-white shadow-lg object-cover`}
        onError={(e) => {
          // Fallback to default avatar if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          target.nextElementSibling?.classList.remove('hidden')
        }}
      />
    )
  }

  // Default avatar with first letter of name
  const firstLetter = participant.display_name.charAt(0).toUpperCase()
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white shadow-lg flex items-center justify-center`}>
      <span className={`${textSizeClasses[size]} font-bold text-white`}>
        {firstLetter}
      </span>
    </div>
  )
}

export function RealTimePublicLeaderboard({ 
  eventId, 
  initialEvent, 
  initialLeaderboard, 
  initialStats 
}: RealTimePublicLeaderboardProps) {
  const [event, setEvent] = useState<Event>(initialEvent)
  const [leaderboard, setLeaderboard] = useState<Participant[]>(initialLeaderboard)
  const [stats, setStats] = useState(initialStats)
  const [mounted, setMounted] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const ScoreIcon = event.score_type === 'points' ? Target : Clock
  const aggregationInfo = getAggregationInfo(event.score_aggregation)
  const AggIcon = aggregationInfo.icon

  // 데이터를 가져오는 함수
  const fetchEventData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/public/event/${eventId}`, {
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
      console.error('Failed to refresh public leaderboard data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [eventId])

  // 실시간 업데이트를 위한 폴링 (5초마다)
  useEffect(() => {
    setMounted(true)
    const interval = setInterval(fetchEventData, 5000) // 공개 페이지는 더 자주 업데이트
    return () => clearInterval(interval)
  }, [fetchEventData])

  // 수동 새로고침
  const handleManualRefresh = () => {
    fetchEventData()
  }

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Clean Background with Subtle Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile Header */}
        <div className="block lg:hidden mb-8">
          {/* Top Bar with Live Indicator and Refresh */}
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium text-sm">LIVE</span>
            </div>

            <LoadingButton
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              loading={isRefreshing}
              className="h-10 w-10 p-0 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
            </LoadingButton>
          </div>

          {/* Title Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 border border-indigo-200 mb-4">
              <Trophy className="h-5 w-5 text-indigo-600" />
              <span className="text-indigo-700 font-medium text-sm">랭킹</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              {event.event_name}
            </h1>

            {event.description && (
              <p className="text-gray-600 text-sm mb-4 max-w-md mx-auto bg-white/80 rounded-lg p-3 border border-gray-200">
                {event.description}
              </p>
            )}
          </div>

          {/* Event Info Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {event.guild_name && (
              <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                <div className="text-xs text-gray-500 mb-1">서버</div>
                <div className="font-semibold text-gray-900 text-sm truncate">{event.guild_name}</div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-xs text-gray-500 mb-1">타입</div>
              <div className="flex items-center justify-center gap-1">
                <ScoreIcon className="h-3 w-3 text-indigo-600" />
                <span className="font-semibold text-gray-900 text-sm">
                  {event.score_type === 'points' ? '포인트' : '시간'}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-xs text-gray-500 mb-1">집계</div>
              <div className="flex items-center justify-center gap-1">
                <AggIcon className="h-3 w-3 text-indigo-600" />
                <span className="font-semibold text-gray-900 text-sm">{aggregationInfo.label}</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-xs text-gray-500 mb-1">상태</div>
              <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                event.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full",
                  event.is_active ? "bg-green-500" : "bg-gray-400"
                )}></div>
                {event.is_active ? '진행중' : '종료'}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <Users className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.participantCount}</div>
              <div className="text-xs text-gray-500 font-medium">참가자</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <BarChart3 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.totalEntries}</div>
              <div className="text-xs text-gray-500 font-medium">총 기록</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {new Date(event.created_at).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              <div className="text-xs text-gray-500 font-medium">시작일</div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400">
            {lastUpdated.toLocaleTimeString()} 업데이트
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block mb-12">
          {/* Top Section with Live Indicator and Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <Trophy className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">LIVE</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {lastUpdated.toLocaleTimeString()} 업데이트
              </div>
              <LoadingButton
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                loading={isRefreshing}
                loadingText="새로고침 중..."
                className="bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                새로고침
              </LoadingButton>
            </div>
          </div>

          {/* Main Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              {event.event_name}
            </h1>

            {event.description && (
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Event Info Section */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {event.guild_name && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                  <div className="text-sm text-gray-500 mb-2">서버</div>
                  <div className="font-bold text-gray-900 text-lg">{event.guild_name}</div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-sm text-gray-500 mb-2">타입</div>
                <div className="flex items-center justify-center gap-2">
                  <ScoreIcon className="h-5 w-5 text-indigo-600" />
                  <span className="font-bold text-gray-900 text-lg">
                    {event.score_type === 'points' ? '포인트' : '시간'}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-sm text-gray-500 mb-2">집계 방식</div>
                <div className="flex items-center justify-center gap-2">
                  <AggIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-gray-900 text-lg">{aggregationInfo.label}</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-sm text-gray-500 mb-2">상태</div>
                <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold",
                  event.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                )}>
                  <div className={cn("w-2 h-2 rounded-full",
                    event.is_active ? "bg-green-500" : "bg-gray-400"
                  )}></div>
                  {event.is_active ? '진행중' : '종료'}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl p-6 text-center">
                <Users className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-indigo-900 mb-1">{stats.participantCount}</div>
                <div className="text-sm text-indigo-700 font-medium">참가자</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 text-center">
                <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-900 mb-1">{stats.totalEntries}</div>
                <div className="text-sm text-blue-700 font-medium">총 기록</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 text-center">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-900 mb-1">
                  {new Date(event.created_at).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm text-purple-700 font-medium">시작일</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Leaderboard */}
        <div className="block sm:hidden">
          {leaderboard.length === 0 ? (
            <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm text-center py-12">
              <CardContent>
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">아직 참가자가 없습니다</h3>
                <p className="text-sm text-gray-600">첫 번째 참가자가 되어보세요!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Podium Section for Top 3 */}
              {leaderboard.length > 0 && (
                <div className="relative">
                  <h2 className="text-center text-xl font-bold text-gray-900 mb-6">🏆 TOP 3 🏆</h2>

                  {/* Podium Layout - Fixed Sizes */}
                  <div className="flex items-end justify-center gap-2 mb-6">
                    {/* 2nd Place (Left) */}
                    {leaderboard[1] && (
                      <div className="flex flex-col items-center">
                        <div className="w-30 h-48 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-400 rounded-xl p-3 pb-4 mb-2 shadow-lg flex flex-col items-center justify-start gap-2">
                          <div className="text-center">
                            <Medal className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                            <div className="text-lg font-bold text-gray-700">2</div>
                          </div>
                          <div className="text-center flex flex-col items-center gap-1 flex-1 w-full">
                            <div className="flex justify-center">
                              <DiscordAvatar participant={leaderboard[1]} size="md" />
                            </div>
                            <div className="text-[10px] font-medium text-gray-600 w-full text-center px-1 truncate max-w-full">
                              {leaderboard[1].display_name}
                            </div>
                            <div className="text-xs font-bold text-gray-800 w-full text-center px-1 truncate max-w-full">
                              {formatScore(
                                leaderboard[1].calculated_score !== undefined
                                  ? leaderboard[1].calculated_score
                                  : leaderboard[1].total_score,
                                event.score_type,
                                event.score_aggregation === 'average'
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-30 h-12 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t border-2 border-gray-400"></div>
                      </div>
                    )}

                    {/* 1st Place (Center, Highest) */}
                    {leaderboard[0] && (
                      <div className="flex flex-col items-center">
                        <div className="w-40 h-60 bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-500 rounded-xl p-4 pb-6 mb-2 shadow-xl relative flex flex-col items-center justify-between">
                          <div className="text-center">
                            <Crown className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-yellow-700">1</div>
                          </div>
                          <div className="text-center w-full flex-1 flex flex-col justify-center items-center">
                            <div className="mb-3">
                              <DiscordAvatar participant={leaderboard[0]} size="lg" />
                            </div>
                            <div className="text-sm font-bold text-gray-800 w-full text-center px-2 mb-2">
                              {leaderboard[0].display_name}
                            </div>
                            <div className="text-sm font-bold text-yellow-700 w-full text-center px-2">
                              {formatScore(
                                leaderboard[0].calculated_score !== undefined
                                  ? leaderboard[0].calculated_score
                                  : leaderboard[0].total_score,
                                event.score_type,
                                event.score_aggregation === 'average'
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-40 h-16 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t border-2 border-yellow-500"></div>
                      </div>
                    )}

                    {/* 3rd Place (Right) */}
                    {leaderboard[2] && (
                      <div className="flex flex-col items-center">
                        <div className="w-32 h-52 bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-500 rounded-xl p-3 pb-5 mb-2 shadow-lg flex flex-col items-center justify-between">
                          <div className="text-center">
                            <Medal className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-orange-700">3</div>
                          </div>
                          <div className="text-center w-full flex-1 flex flex-col justify-center items-center">
                            <div className="mb-2">
                              <DiscordAvatar participant={leaderboard[2]} size="md" />
                            </div>
                            <div className="text-xs font-bold text-gray-800 w-full text-center px-2 mb-2">
                              {leaderboard[2].display_name}
                            </div>
                            <div className="text-xs font-bold text-orange-700 w-full text-center px-2">
                              {formatScore(
                                leaderboard[2].calculated_score !== undefined
                                  ? leaderboard[2].calculated_score
                                  : leaderboard[2].total_score,
                                event.score_type,
                                event.score_aggregation === 'average'
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-32 h-8 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t border-2 border-orange-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remaining Participants List - Compact */}
              {leaderboard.length > 3 && (
                <div>
                  <h3 className="text-base font-medium text-gray-600 mb-3 text-center">나머지 순위</h3>
                  <div className="space-y-2">
                    {leaderboard.slice(3).map((participant) => {
                      const displayScore = participant.calculated_score !== undefined
                        ? participant.calculated_score
                        : participant.total_score

                      return (
                        <div key={participant.rank} className="bg-gray-50 border border-gray-100 rounded-lg p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                                {participant.rank}
                              </div>
                              <DiscordAvatar participant={participant} size="sm" />
                              <div>
                                <h4 className="text-sm font-medium text-gray-800 truncate">{participant.display_name}</h4>
                                <p className="text-xs text-gray-500">{participant.entry_count}회</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-700">
                                {formatScore(displayScore, event.score_type, event.score_aggregation === 'average')}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Share Button */}
          <div className="mt-8 text-center">
            <ShareButton
              eventName={event.event_name}
              eventId={eventId}
              className="w-full bg-indigo-600 hover:bg-indigo-700 border-0 text-white shadow-lg"
            />
          </div>
        </div>

        {/* Desktop Leaderboard */}
        <div className="hidden sm:block max-w-6xl mx-auto">
          {leaderboard.length === 0 ? (
            <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm text-center py-20">
              <CardContent>
                <Trophy className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-900 mb-3">아직 참가자가 없습니다</h3>
                <p className="text-lg text-gray-600">첫 번째 참가자가 되어보세요!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-12">
              {/* Desktop Podium Section */}
              {leaderboard.length > 0 && (
                <div className="relative">
                  <h2 className="text-center text-4xl font-bold text-gray-900 mb-12">🏆 TOP3 🏆</h2>

                  {/* Large Desktop Podium - Fixed Sizes with Better Score Space */}
                  <div className="flex items-end justify-center gap-6 mb-12">
                    {/* 2nd Place (Left) */}
                    {leaderboard[1] && (
                      <div className="flex flex-col items-center">
                        <div className="w-56 h-80 bg-gradient-to-br from-gray-50 to-gray-100 border-4 border-gray-400 rounded-2xl p-6 mb-4 shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-between overflow-hidden">
                          <div className="text-center">
                            <Medal className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-gray-700 mb-1">2</div>
                          </div>
                          <div className="text-center flex flex-col items-center justify-center flex-1 w-full">
                            <div className="mb-3 flex justify-center">
                              <DiscordAvatar participant={leaderboard[1]} size="lg" />
                            </div>
                            <div className="text-sm font-bold text-gray-800 mb-2 w-full text-center px-1 truncate max-w-full">
                              {leaderboard[1].display_name}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {leaderboard[1].entry_count}회 참여
                            </div>
                            <div className="text-sm font-bold text-gray-800 w-full text-center px-1 truncate max-w-full leading-tight">
                              {formatScore(
                                leaderboard[1].calculated_score !== undefined
                                  ? leaderboard[1].calculated_score
                                  : leaderboard[1].total_score,
                                event.score_type,
                                event.score_aggregation === 'average'
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-56 h-24 bg-gradient-to-t from-gray-500 to-gray-400 rounded-t-lg border-4 border-gray-400 shadow-lg"></div>
                      </div>
                    )}

                    {/* 1st Place (Center, Highest) */}
                    {leaderboard[0] && (
                      <div className="flex flex-col items-center">
                        <div className="w-64 h-96 bg-gradient-to-br from-yellow-50 to-amber-50 border-4 border-yellow-500 rounded-2xl p-6 mb-4 shadow-2xl hover:scale-105 transition-all duration-300 relative flex flex-col items-center justify-between overflow-hidden">
                          <div className="text-center">
                            <Crown className="h-14 w-14 text-yellow-600 mx-auto mb-2" />
                            <div className="text-5xl font-bold text-yellow-700 mb-2">1</div>
                          </div>
                          <div className="text-center flex flex-col items-center justify-center flex-1 w-full">
                            <div className="mb-4 flex justify-center">
                              <DiscordAvatar participant={leaderboard[0]} size="xl" />
                            </div>
                            <div className="text-lg font-bold text-gray-900 mb-2 w-full text-center px-1 truncate max-w-full">
                              {leaderboard[0].display_name}
                            </div>
                            <div className="text-sm text-gray-700 mb-3">
                              {leaderboard[0].entry_count}회 참여
                            </div>
                            <div className="text-lg font-bold text-yellow-700 w-full text-center px-1 truncate max-w-full leading-tight">
                              {formatScore(
                                leaderboard[0].calculated_score !== undefined
                                  ? leaderboard[0].calculated_score
                                  : leaderboard[0].total_score,
                                event.score_type,
                                event.score_aggregation === 'average'
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-64 h-32 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg border-4 border-yellow-500 shadow-lg"></div>
                      </div>
                    )}

                    {/* 3rd Place (Right) */}
                    {leaderboard[2] && (
                      <div className="flex flex-col items-center">
                        <div className="w-56 h-72 bg-gradient-to-br from-orange-50 to-amber-50 border-4 border-orange-500 rounded-2xl p-6 mb-4 shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-between overflow-hidden">
                          <div className="text-center">
                            <Medal className="h-10 w-10 text-orange-600 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-orange-700 mb-1">3</div>
                          </div>
                          <div className="text-center flex flex-col items-center justify-center flex-1 w-full">
                            <div className="mb-3 flex justify-center">
                              <DiscordAvatar participant={leaderboard[2]} size="lg" />
                            </div>
                            <div className="text-sm font-bold text-gray-800 mb-2 w-full text-center px-1 truncate max-w-full">
                              {leaderboard[2].display_name}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {leaderboard[2].entry_count}회 참여
                            </div>
                            <div className="text-sm font-bold text-orange-700 w-full text-center px-1 truncate max-w-full leading-tight mb-3">
                              {formatScore(
                                leaderboard[2].calculated_score !== undefined
                                  ? leaderboard[2].calculated_score
                                  : leaderboard[2].total_score,
                                event.score_type,
                                event.score_aggregation === 'average'
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-56 h-16 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg border-4 border-orange-500 shadow-lg"></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remaining Participants - Desktop List (Compact) */}
              {leaderboard.length > 3 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-6 text-center">나머지 순위</h3>
                  <div className="grid gap-3 max-w-3xl mx-auto">
                    {leaderboard.slice(3).map((participant) => {
                      const displayScore = participant.calculated_score !== undefined
                        ? participant.calculated_score
                        : participant.total_score

                      return (
                        <div key={participant.rank} className="bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-white transition-all duration-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 border border-gray-300">
                                <span className="text-gray-700 font-bold text-sm">#{participant.rank}</span>
                              </div>
                              <DiscordAvatar participant={participant} size="md" />
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{participant.display_name}</h4>
                                <p className="text-gray-500 text-sm">{participant.entry_count}회 참여</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-800 mb-1">
                                {formatScore(displayScore, event.score_type, event.score_aggregation === 'average')}
                              </div>
                              {event.score_aggregation === 'average' && participant.entry_count > 1 && (
                                <p className="text-gray-400 text-xs">
                                  평균 {participant.entry_count}회
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Share & Footer */}
        <div className="text-center mt-16 space-y-6">
          <div className="hidden sm:block">
            <ShareButton
              eventName={event.event_name}
              eventId={event.id}
              className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white shadow-lg px-8 py-3 text-lg"
            />
          </div>

          <p className="text-gray-500 text-sm bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 inline-block border border-gray-200">
            마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
          </p>
        </div>
      </div>
      
    </div>
  )
}

const styles = `
  @keyframes gridMove {
    0% { transform: translate(0, 0); }
    100% { transform: translate(50px, 50px); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-10px) rotate(120deg); }
    66% { transform: translateY(5px) rotate(240deg); }
  }

  @keyframes rainbow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes holographic {
    0% { filter: hue-rotate(0deg) saturate(1); }
    25% { filter: hue-rotate(90deg) saturate(1.2); }
    50% { filter: hue-rotate(180deg) saturate(0.8); }
    75% { filter: hue-rotate(270deg) saturate(1.1); }
    100% { filter: hue-rotate(360deg) saturate(1); }
  }
`

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}