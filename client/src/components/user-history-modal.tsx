"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Clock, Target, Calendar, User, BarChart3 } from "lucide-react"

interface ScoreEntry {
  id: number
  score: number
  created_at: string
  added_by: string
  note?: string
}

interface UserHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  eventId: string
  eventName: string
  scoreType: 'points' | 'time_seconds'
  aggregationType: string
}

function formatScore(score: number, scoreType: string) {
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

function getAggregationLabel(aggregationType: string) {
  switch (aggregationType) {
    case 'sum': return '총합'
    case 'average': return '평균'
    case 'best': return '최고 기록'
    default: return '총합'
  }
}

export function UserHistoryModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName, 
  eventId, 
  eventName, 
  scoreType, 
  aggregationType 
}: UserHistoryModalProps) {
  const [entries, setEntries] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId && eventId) {
      fetchUserEntries()
    }
  }, [isOpen, userId, eventId])

  const fetchUserEntries = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/participants/history?eventId=${eventId}&userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user entries')
      }
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (err) {
      console.error('Error fetching user entries:', err)
      setError('기록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (entries.length === 0) return { total: 0, average: 0, best: 0, aggregated: 0 }
    
    const scores = entries.map(e => e.score)
    const total = scores.reduce((sum, score) => sum + score, 0)
    const average = total / entries.length
    const best = scoreType === 'time_seconds' 
      ? Math.min(...scores)
      : Math.max(...scores)
    
    // 집계 방식에 따른 최종 점수 계산
    let aggregated = 0
    switch (aggregationType) {
      case 'sum':
        aggregated = total
        break
      case 'average':
        aggregated = average
        break
      case 'best':
        aggregated = best
        break
      default:
        aggregated = total
    }
    
    return { total, average, best, aggregated }
  }

  const stats = calculateStats()
  const ScoreIcon = scoreType === 'points' ? Target : Clock

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {userName}의 참여 기록
          </DialogTitle>
          <DialogDescription>
            {eventName} 이벤트의 모든 기록
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">기록을 불러오는 중...</div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-4">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {/* 통계 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">총 참여 횟수</span>
                  </div>
                  <div className="text-2xl font-bold">{entries.length}회</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ScoreIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {getAggregationLabel(aggregationType)} 점수
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatScore(stats.aggregated, scoreType)}
                  </div>
                  {aggregationType === 'average' && entries.length > 1 && (
                    <div className="text-xs text-gray-500 mt-1">
                      총합: {formatScore(stats.total, scoreType)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">
                      {scoreType === 'time_seconds' ? '최단 기록' : '최고 점수'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatScore(stats.best, scoreType)}
                  </div>
                  {aggregationType !== 'best' && (
                    <div className="text-xs text-gray-500 mt-1">
                      개인 베스트
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 기록 목록 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">상세 기록</h3>
              {entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  아직 기록이 없습니다.
                </div>
              ) : (
                entries.map((entry, index) => {
                  const isBestScore = entry.score === stats.best
                  const isHighlighted = (aggregationType === 'best' && isBestScore)
                  
                  return (
                    <Card 
                      key={entry.id} 
                      className={`${
                        isHighlighted 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                          : 'bg-slate-50 dark:bg-slate-800'
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={isHighlighted ? "default" : "outline"}
                              className={isHighlighted ? "bg-yellow-500 text-white" : ""}
                            >
                              #{entries.length - index}
                              {isHighlighted && aggregationType === 'best' && (
                                <Trophy className="ml-1 h-3 w-3" />
                              )}
                            </Badge>
                            <div>
                              <div className={`font-semibold ${
                                isHighlighted ? 'text-yellow-800 dark:text-yellow-200' : ''
                              }`}>
                                {formatScore(entry.score, scoreType)}
                              </div>
                              {entry.note && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {entry.note}
                                </div>
                              )}
                            </div>
                          </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(entry.created_at).toLocaleString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                          {entry.added_by && (
                            <div className="text-xs text-gray-400 mt-1">
                              by {entry.added_by}
                            </div>
                          )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}