"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Crown, Medal, Target, Clock, Zap, Star, Calendar, Users, BarChart3, Sparkles, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { ShareButton } from "./share-button"
import { Button } from "@/components/ui/button"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-white/90 font-medium">실시간 랭킹</span>
              <Sparkles className="h-5 w-5 text-yellow-400" />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              <span>마지막 업데이트: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            {event.event_name}
          </h1>
          
          {event.description && (
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-6">
              {event.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {event.guild_name && (
              <Badge variant="outline" className="px-4 py-2 bg-white/10 text-white border-white/30 text-base">
                {event.guild_name}
              </Badge>
            )}
            
            <Badge variant="outline" className="px-4 py-2 bg-white/10 text-white border-white/30 text-base">
              <ScoreIcon className="mr-2 h-4 w-4" />
              {event.score_type === 'points' ? '포인트' : '시간'}
            </Badge>
            
            <Badge variant="outline" className="px-4 py-2 bg-white/10 text-white border-white/30 text-base">
              <AggIcon className="mr-2 h-4 w-4" />
              {aggregationInfo.label}
            </Badge>
            
            <Badge 
              variant={event.is_active ? "default" : "secondary"} 
              className={cn("px-4 py-2 text-base", 
                event.is_active 
                  ? "bg-green-500/20 text-green-300 border-green-500/50" 
                  : "bg-red-500/20 text-red-300 border-red-500/50"
              )}
            >
              {event.is_active ? '진행 중' : '종료됨'}
            </Badge>
          </div>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 text-white/80">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">참가자</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.participantCount}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">총 기록</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalEntries}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">시작일</span>
              </div>
              <div className="text-lg font-bold text-white">
                {new Date(event.created_at).toLocaleDateString('ko-KR', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="max-w-4xl mx-auto">
          {leaderboard.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center py-16">
              <CardContent>
                <Trophy className="h-16 w-16 text-white/50 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">아직 참가자가 없습니다</h3>
                <p className="text-white/70">첫 번째 참가자가 되어보세요!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaderboard.slice(0, 3).map((participant, index) => {
                const displayScore = participant.calculated_score !== undefined 
                  ? participant.calculated_score 
                  : participant.total_score

                return (
                  <Card 
                    key={participant.rank} 
                    className={cn(
                      "group relative overflow-hidden transition-all duration-500 hover:scale-105 border-0",
                      participant.rank === 1 && "bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-yellow-500/20 shadow-yellow-500/25 shadow-2xl",
                      participant.rank === 2 && "bg-gradient-to-r from-gray-400/20 via-gray-300/10 to-gray-400/20 shadow-gray-400/25 shadow-xl",
                      participant.rank === 3 && "bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-amber-600/20 shadow-amber-500/25 shadow-xl"
                    )}
                    style={{
                      animationDelay: `${index * 150}ms`,
                      animation: 'slideUp 0.8s ease-out forwards'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm" />
                    <CardContent className="relative p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-4">
                            {getRankIcon(participant.rank)}
                            <div className={cn(
                              "text-6xl font-black",
                              participant.rank === 1 && "text-yellow-600 drop-shadow-xl",
                              participant.rank === 2 && "text-gray-600 drop-shadow-xl",
                              participant.rank === 3 && "text-amber-700 drop-shadow-xl",
                              participant.rank > 3 && "text-slate-700 drop-shadow-lg"
                            )}>
                              #{participant.rank}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-3xl font-bold text-slate-800 drop-shadow-lg mb-2">
                              {participant.display_name}
                            </h3>
                            <p className="text-slate-700 drop-shadow-sm">
                              {participant.entry_count}회 참여
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={cn(
                            "text-4xl font-bold mb-1 drop-shadow-lg",
                            participant.rank === 1 && "text-yellow-600",
                            participant.rank === 2 && "text-gray-600", 
                            participant.rank === 3 && "text-amber-700",
                            participant.rank > 3 && "text-slate-700"
                          )}>
                            {formatScore(displayScore, event.score_type, event.score_aggregation === 'average')}
                          </div>
                          <p className="text-slate-600 text-sm drop-shadow-sm">
                            {aggregationInfo.label} 점수
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {/* Remaining participants */}
              {leaderboard.slice(3).map((participant, index) => {
                const displayScore = participant.calculated_score !== undefined 
                  ? participant.calculated_score 
                  : participant.total_score

                return (
                  <Card 
                    key={participant.rank}
                    className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300"
                    style={{
                      animationDelay: `${(index + 3) * 100}ms`,
                      animation: 'slideUp 0.6s ease-out forwards'
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <Trophy className="h-5 w-5 text-slate-400" />
                            <span className="text-2xl font-bold text-white/90">
                              #{participant.rank}
                            </span>
                          </div>
                          
                          <div>
                            <h4 className="text-xl font-semibold text-white">
                              {participant.display_name}
                            </h4>
                            <p className="text-sm text-white/60">
                              {participant.entry_count}회 참여
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">
                            {formatScore(displayScore, event.score_type, event.score_aggregation === 'average')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Share & Footer */}
        <div className="text-center mt-16 space-y-6">
          <ShareButton eventName={event.event_name} eventId={event.id} />
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-white/80 text-sm">5초마다 자동 업데이트</span>
          </div>
          
          <p className="text-white/50 text-sm">
            마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}