"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Edit2, Settings, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Event {
  id: number
  event_name: string
  description: string
  score_type: 'points' | 'time_seconds'
  sort_direction: 'desc' | 'asc'
  score_aggregation: 'sum' | 'average' | 'best'
  is_active: boolean
  guild_id: string
  created_at: string
}

interface EventEditDialogProps {
  event: Event
  userIsAdmin: boolean
  onEventUpdated?: () => void
  hasScoreEntries?: boolean
}

export function EventEditDialog({ event, userIsAdmin, onEventUpdated, hasScoreEntries = false }: EventEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [eventName, setEventName] = useState(event.event_name)
  const [description, setDescription] = useState(event.description || "")
  const [scoreType, setScoreType] = useState(event.score_type)
  const [sortDirection, setSortDirection] = useState(event.sort_direction)
  const [scoreAggregation, setScoreAggregation] = useState(event.score_aggregation)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  if (!userIsAdmin) {
    return null
  }

  const handleDialogOpen = (open: boolean) => {
    if (open) {
      // 다이얼로그 열 때 초기값 리셋
      setEventName(event.event_name)
      setDescription(event.description || "")
      setScoreType(event.score_type)
      setSortDirection(event.sort_direction)
      setScoreAggregation(event.score_aggregation)
      setError("")
      setSuccess("")
    }
    setIsOpen(open)
  }

  const handleSubmit = async () => {
    if (!eventName.trim()) {
      setError("이벤트 이름을 입력해주세요.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_name: eventName.trim(),
          description: description.trim(),
          score_type: hasScoreEntries ? undefined : scoreType, // 점수가 있으면 타입 변경 불가
          sort_direction: sortDirection,
          score_aggregation: scoreAggregation
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update event')
      }

      setSuccess("이벤트 정보가 성공적으로 업데이트되었습니다!")
      
      // 즉시 업데이트 콜백 호출
      if (onEventUpdated) {
        onEventUpdated()
      }
      
      // UI 피드백을 위한 지연된 모달 닫기
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : '이벤트 업데이트 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatScoreType = (type: string) => {
    return type === 'points' ? '포인트' : '시간 (초)'
  }

  const formatSortDirection = (direction: string) => {
    return direction === 'desc' ? '높은 점수 우선' : '낮은 점수 우선'
  }

  const formatScoreAggregation = (aggregation: string) => {
    switch (aggregation) {
      case 'sum': return '합계'
      case 'average': return '평균'
      case 'best': return '최고 기록'
      default: return aggregation
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit2 className="mr-2 h-4 w-4" />
          이벤트 수정
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            이벤트 정보 수정 - {event.event_name}
          </DialogTitle>
          <DialogDescription>
            이벤트 기본 정보를 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

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
          <div className="space-y-2">
            <Label htmlFor="eventName">이벤트 이름 *</Label>
            <Input
              id="eventName"
              placeholder="이벤트 이름을 입력하세요"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="이벤트 설명을 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>점수 타입</Label>
              {hasScoreEntries ? (
                <div className="p-3 bg-gray-50 border rounded-lg">
                  <div className="text-sm font-medium">{formatScoreType(scoreType)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    점수 기록이 있어 변경할 수 없습니다
                  </div>
                </div>
              ) : (
                <Select value={scoreType} onValueChange={setScoreType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">포인트</SelectItem>
                    <SelectItem value="time_seconds">시간 (초)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>순위 정렬</Label>
              <Select value={sortDirection} onValueChange={setSortDirection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">높은 점수 우선</SelectItem>
                  <SelectItem value="asc">낮은 점수 우선</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>점수 집계 방식</Label>
            <Select value={scoreAggregation} onValueChange={setScoreAggregation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">합계 - 모든 점수를 더함</SelectItem>
                <SelectItem value="average">평균 - 모든 점수의 평균</SelectItem>
                <SelectItem value="best">최고 기록 - 가장 좋은 점수만</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 현재 설정 요약 */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">현재 설정</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• 점수 타입: {formatScoreType(scoreType)}</div>
              <div>• 순위 정렬: {formatSortDirection(sortDirection)}</div>
              <div>• 집계 방식: {formatScoreAggregation(scoreAggregation)}</div>
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
            disabled={loading || !eventName.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                업데이트 중...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                업데이트
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}