"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { SectionLoadingOverlay } from "@/components/ui/loading-overlay"
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
import { Plus, User, Trophy, Clock, Target, AlertCircle, Search, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface ScoreManagementProps {
  event: Event
  userIsAdmin: boolean
}

export function ScoreManagement({ event, userIsAdmin }: ScoreManagementProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [score, setScore] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!userIsAdmin || !event.is_active) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !score.trim()) {
      setError("사용자명과 점수를 모두 입력해주세요")
      return
    }

    const scoreValue = parseFloat(score)
    if (isNaN(scoreValue) || scoreValue < 0) {
      setError("유효한 점수를 입력해주세요")
      return
    }

    setLoading(true)
    setError("")

    try {
      // 실제 구현에서는 백엔드 API 호출
      console.log(`Adding score for ${username}: ${scoreValue} to event ${event.id}`)
      
      // 임시로 Discord 명령어 사용 안내
      alert(`Discord에서 다음 명령어를 사용하세요:\n/점수추가 이벤트:${event.event_name} 사용자:@${username} 점수:${scoreValue}`)
      
      setIsOpen(false)
      setUsername("")
      setScore("")
    } catch {
      setError("점수 추가 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  const getScoreTypeInfo = (scoreType: string) => {
    switch (scoreType) {
      case 'points':
        return { label: '포인트', icon: Target, placeholder: "100", unit: "점" }
      case 'time_seconds':
        return { label: '시간 (초)', icon: Clock, placeholder: "60", unit: "초" }
      default:
        return { label: '포인트', icon: Target, placeholder: "100", unit: "점" }
    }
  }

  const scoreTypeInfo = getScoreTypeInfo(event.score_type)
  const ScoreIcon = scoreTypeInfo.icon

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          점수 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            점수 추가
          </DialogTitle>
          <DialogDescription>
            <strong>{event.event_name}</strong> 이벤트에 점수를 추가합니다
          </DialogDescription>
        </DialogHeader>

        {/* Loading Overlay */}
        <SectionLoadingOverlay isVisible={loading} message="점수 추가 중..." />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              사용자명
            </Label>
            <Input
              id="username"
              placeholder="Discord 사용자명 (@ 제외)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

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

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              현재는 Discord 명령어를 사용해주세요: <code>/점수추가</code>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
              취소
            </Button>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="추가 중..."
            >
              점수 추가
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}