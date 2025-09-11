"use client"

import React, { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import { Plus, Trophy, Clock, Target, AlertCircle, Search, Loader2, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useGuildMembers, type GuildMember } from "@/hooks/useGuildMembers"

interface Event {
  id: number
  event_name: string
  guild_id: string
  score_type: 'points' | 'time_seconds'
  is_active: boolean
}

interface ScoreManagementProps {
  event: Event
  userIsAdmin: boolean
}

export function EnhancedScoreManagement({ event, userIsAdmin }: ScoreManagementProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [score, setScore] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GuildMember[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
  // 길드 멤버 정보를 비동기로 로드
  const { members, isLoading: membersLoading, error: membersError, searchMembers } = useGuildMembers(event.guild_id)
  
  // 검색 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  if (!userIsAdmin || !event.is_active) {
    return null
  }

  const handleDialogOpen = (open: boolean) => {
    if (open && membersLoading) {
      // 멤버 정보가 로딩 중이면 다이얼로그를 열지 않음
      return
    }
    
    setIsOpen(open)
    if (!open) {
      // 다이얼로그가 닫힐 때 상태 초기화
      setSelectedUserId("")
      setScore("")
      setNote("")
      setError("")
      setSuccess("")
      setSearchQuery("")
      setSearchResults([])
      setShowDropdown(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    
    setShowDropdown(true)
    setSearchLoading(true)
    try {
      const results = await searchMembers(query)
      setSearchResults(results)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedUserId || !score) {
      setError("사용자와 점수를 모두 입력해주세요.")
      return
    }

    const scoreValue = parseFloat(score)
    if (isNaN(scoreValue)) {
      setError("유효한 점수를 입력해주세요.")
      return
    }

    if (event.score_type === 'time_seconds' && scoreValue <= 0) {
      setError("시간은 0보다 큰 값이어야 합니다.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const selectedMember = [...members, ...searchResults].find(m => m.user_id === selectedUserId)
      if (!selectedMember) {
        setError("선택된 사용자를 찾을 수 없습니다.")
        return
      }

      // 1. 참가자 추가 또는 조회
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
          avatarUrl: selectedMember.avatar_url
        })
      })

      if (!participantResponse.ok) {
        throw new Error('Failed to add participant')
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
          addedBy: session?.user?.discordId || 'unknown',
          note: note.trim()
        })
      })

      if (!scoreResponse.ok) {
        throw new Error('Failed to add score')
      }

      setSuccess(`${selectedMember.display_name}님에게 점수가 추가되었습니다!`)
      
      // 폼 초기화
      setSelectedUserId("")
      setScore("")
      setNote("")
      setSearchQuery("")
      setSearchResults([])
      setShowDropdown(false)
      
      // 즉시 페이지 새로고침
      setTimeout(() => {
        setIsOpen(false)
        window.location.reload()
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : '점수 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatScoreDisplay = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return value
    
    if (event.score_type === 'time_seconds') {
      const totalSeconds = Math.round(num)
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
    }
    
    return `${num}점`
  }

  const ScoreIcon = event.score_type === 'points' ? Target : Clock

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          disabled={membersLoading}
        >
          {membersLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              멤버 로딩 중...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              점수 추가
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScoreIcon className="h-5 w-5" />
            점수 추가 - {event.event_name}
          </DialogTitle>
          <DialogDescription>
            참가자를 선택하고 점수를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        {membersError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              멤버 정보를 불러오는데 실패했습니다: {membersError}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* 사용자 검색 및 선택 */}
          <div className="space-y-2">
            <Label htmlFor="userSearch">사용자 선택</Label>
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="userSearch"
                placeholder="사용자를 검색하세요..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.trim() && searchResults.length > 0 && setShowDropdown(true)}
                className="pl-10"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
              )}
              
              {/* 검색 결과 드롭다운 */}
              {showDropdown && searchQuery.trim() && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((member) => (
                    <div
                      key={member.user_id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        selectedUserId === member.user_id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => {
                        setSelectedUserId(member.user_id)
                        setSearchQuery(member.display_name)
                        setShowDropdown(false)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>
                            {member.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.display_name}</div>
                          <div className="text-sm text-gray-500">@{member.username}</div>
                        </div>
                        {selectedUserId === member.user_id && (
                          <Badge className="ml-auto">선택됨</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 검색했지만 결과가 없을 때 힌트 */}
              {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
                <div className="text-sm text-gray-500 mt-2">
                  검색 결과가 없습니다. 다른 키워드로 시도해보세요.
                </div>
              )}
            </div>
            
            {/* 선택된 사용자 표시 */}
            {selectedUserId && (() => {
              const selectedMember = [...members, ...searchResults].find(m => m.user_id === selectedUserId)
              return selectedMember ? (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedMember.avatar_url} />
                      <AvatarFallback>
                        {selectedMember.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-blue-900">{selectedMember.display_name}</div>
                      <div className="text-sm text-blue-700">@{selectedMember.username}</div>
                    </div>
                    <Badge className="ml-auto bg-blue-600">선택됨</Badge>
                  </div>
                </div>
              ) : null
            })()}
          </div>

          {/* 점수 입력 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="score">
                점수 ({event.score_type === 'points' ? '포인트' : '시간(초)'}) *
              </Label>
              <Input
                id="score"
                type="number"
                placeholder={event.score_type === 'points' ? "예: 100" : "예: 125 (2분 5초)"}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                step={event.score_type === 'time_seconds' ? '0.1' : '1'}
                min={event.score_type === 'time_seconds' ? '0.1' : undefined}
              />
              {score && (
                <div className="text-sm text-gray-600">
                  미리보기: {formatScoreDisplay(score)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">메모 (선택사항)</Label>
              <Input
                id="note"
                placeholder="점수에 대한 메모..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedUserId || !score}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                추가 중...
              </>
            ) : (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                점수 추가
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}