"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, User, Trophy, Clock, Target, AlertCircle, Search, Loader2, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface Event {
  id: number
  event_name: string
  guild_id: string
  score_type: 'points' | 'time_seconds'
  is_active: boolean
}

interface GuildMember {
  user_id: string
  username: string
  display_name: string
  is_bot: boolean
  avatar_url?: string
}

interface Participant {
  id: number
  user_id: string
  username: string
}

interface ScoreManagementProps {
  event: Event
  userIsAdmin: boolean
}

export function EnhancedScoreManagement({ event, userIsAdmin }: ScoreManagementProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [score, setScore] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Guild members state
  const [members, setMembers] = useState<GuildMember[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  if (!userIsAdmin || !event.is_active) {
    return null
  }

  // Load guild members
  useEffect(() => {
    if (isOpen) {
      loadMembers()
    }
  }, [isOpen])

  const loadMembers = async () => {
    setLoadingMembers(true)
    try {
      const response = await fetch(`/api/guild/${event.guild_id}/members?limit=50`)
      if (response.ok) {
        const memberData = await response.json()
        setMembers(memberData.filter((m: GuildMember) => !m.is_bot))
      }
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const searchMembers = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadMembers()
      return
    }

    setLoadingMembers(true)
    try {
      const response = await fetch(`/api/guild/${event.guild_id}/members?search=${encodeURIComponent(query)}&limit=20`)
      if (response.ok) {
        const memberData = await response.json()
        setMembers(memberData.filter((m: GuildMember) => !m.is_bot))
      }
    } catch (error) {
      console.error('Error searching members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }, [event.guild_id])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMembers(searchQuery)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchMembers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUserId) {
      setError("사용자를 선택해주세요")
      return
    }

    if (!score.trim()) {
      setError("점수를 입력해주세요")
      return
    }

    const scoreValue = parseFloat(score)
    if (isNaN(scoreValue)) {
      setError("유효한 점수를 입력해주세요")
      return
    }

    if (!session?.user?.id) {
      setError("로그인이 필요합니다")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // 1. 참가자 추가 또는 확인
      const selectedMember = members.find(m => m.user_id === selectedUserId)
      if (!selectedMember) {
        throw new Error("선택된 사용자를 찾을 수 없습니다")
      }

      // 참가자 등록
      const participantResponse = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          userId: selectedMember.user_id,
          username: selectedMember.username,
          discriminator: '0',
          avatarUrl: selectedMember.avatar_url || null
        })
      })

      if (!participantResponse.ok) {
        const errorData = await participantResponse.json()
        throw new Error(errorData.error || 'Failed to add participant')
      }

      const participant = await participantResponse.json()

      // 2. 점수 추가
      const scoreResponse = await fetch(`/api/participants/${participant.id}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: scoreValue,
          addedBy: session.user.id,
          note: note.trim() || null
        })
      })

      if (!scoreResponse.ok) {
        const errorData = await scoreResponse.json()
        throw new Error(errorData.error || 'Failed to add score')
      }

      setSuccess(`${selectedMember.display_name}에게 ${formatScoreDisplay(scoreValue, event.score_type)} 점수를 추가했습니다!`)
      setScore("")
      setNote("")
      setSelectedUserId("")
      
      // 3초 후 다이얼로그 닫기
      setTimeout(() => {
        setIsOpen(false)
        setSuccess("")
        // 페이지 새로고침으로 리더보드 업데이트
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('Error adding score:', error)
      setError(error instanceof Error ? error.message : '점수 추가 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const formatScoreDisplay = (scoreValue: number, scoreType: string) => {
    switch (scoreType) {
      case 'time_seconds':
        if (scoreValue < 60) {
          return `${scoreValue}초`
        } else if (scoreValue < 3600) {
          const minutes = Math.floor(scoreValue / 60)
          const seconds = scoreValue % 60
          return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`
        } else {
          const hours = Math.floor(scoreValue / 3600)
          const minutes = Math.floor((scoreValue % 3600) / 60)
          const seconds = scoreValue % 60
          let result = `${hours}시간`
          if (minutes > 0) result += ` ${minutes}분`
          if (seconds > 0) result += ` ${seconds}초`
          return result
        }
      case 'points':
      default:
        return `${scoreValue}점`
    }
  }

  const getScoreTypeInfo = (scoreType: string) => {
    switch (scoreType) {
      case 'points':
        return { label: '포인트', icon: Target, placeholder: "100", unit: "점" }
      case 'time_seconds':
        return { label: '시간 (초)', icon: Clock, placeholder: "60.5", unit: "초" }
      default:
        return { label: '포인트', icon: Target, placeholder: "100", unit: "점" }
    }
  }

  const scoreTypeInfo = getScoreTypeInfo(event.score_type)
  const ScoreIcon = scoreTypeInfo.icon

  const filteredMembers = members.filter(member =>
    member.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          점수 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            점수 추가
          </DialogTitle>
          <DialogDescription>
            <strong>{event.event_name}</strong> 이벤트에 참가자의 점수를 추가합니다
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <Trophy className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 사용자 선택 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                참가자 선택
              </Label>
              
              {/* 검색 입력 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="사용자 이름으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
                {loadingMembers && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>

              {/* 멤버 선택 */}
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="참가자를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredMembers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      {loadingMembers ? "로딩 중..." : "사용자를 찾을 수 없습니다"}
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback>{member.display_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{member.display_name}</span>
                            <span className="text-xs text-gray-500">@{member.username}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 점수 입력 */}
            <div className="space-y-2">
              <Label htmlFor="score" className="flex items-center gap-2">
                <ScoreIcon className="h-4 w-4" />
                {scoreTypeInfo.label}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="score"
                  type="number"
                  step={event.score_type === 'time_seconds' ? "0.1" : "1"}
                  min="0"
                  placeholder={scoreTypeInfo.placeholder}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  disabled={loading}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-0">
                  {scoreTypeInfo.unit}
                </span>
              </div>
            </div>

            {/* 메모 (선택사항) */}
            <div className="space-y-2">
              <Label htmlFor="note">메모 (선택사항)</Label>
              <Input
                id="note"
                placeholder="점수에 대한 메모..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={loading}
                maxLength={200}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)} 
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" disabled={loading || !selectedUserId || !score}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    추가 중...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    점수 추가
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}