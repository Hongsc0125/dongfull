"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users } from "lucide-react"
import { UserHistoryModal } from "./user-history-modal"

interface Event {
  id: number
  event_name: string
  score_type: 'points' | 'time_seconds'
  score_aggregation: 'sum' | 'average' | 'best'
  sort_direction: 'asc' | 'desc'
  is_active: boolean
}

interface Participant {
  rank: number
  user_id: string
  display_name: string
  total_score?: number
  calculated_score?: number
  entry_count: number
}

interface LeaderboardWithModalProps {
  event: Event
  leaderboard: Participant[]
  userIsAdmin: boolean
  onDataUpdated?: () => void
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

function getAggregationDisplay(aggregation: string) {
  switch (aggregation) {
    case 'sum':
      return { label: '총합' }
    case 'average':
      return { label: '평균' }
    case 'best':
      return { label: '베스트' }
    default:
      return { label: '총합' }
  }
}

export function LeaderboardWithModal({ event, leaderboard, userIsAdmin, onDataUpdated }: LeaderboardWithModalProps) {
  const [selectedUser, setSelectedUser] = useState<{
    userId: string
    userName: string
  } | null>(null)

  const aggregationInfo = getAggregationDisplay(event.score_aggregation)

  const handleUserClick = (participant: Participant) => {
    setSelectedUser({
      userId: participant.user_id,
      userName: participant.display_name
    })
  }

  return (
    <>
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
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      participant.rank <= 3 
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                    onClick={() => handleUserClick(participant)}
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
                          총 {participant.entry_count || 0}회 참여
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatScore(displayScore, event.score_type)}
                      </div>
                      {event.score_aggregation !== 'best' && (participant.entry_count || 0) > 1 && (
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

      {selectedUser && (
        <UserHistoryModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          userId={selectedUser.userId}
          userName={selectedUser.userName}
          eventId={event.id.toString()}
          eventName={event.event_name}
          scoreType={event.score_type}
          aggregationType={event.score_aggregation}
          sortDirection={event.sort_direction}
          userIsAdmin={userIsAdmin}
          onEntryUpdated={onDataUpdated}
        />
      )}
    </>
  )
}