"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit2, Trash2, AlertCircle, Loader2, Clock, Target } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ScoreEntry {
  id: number
  score: number
  note: string | null
  added_by: string
  created_at: string
}

interface ScoreEntryActionsProps {
  entry: ScoreEntry
  scoreType: 'points' | 'time_seconds'
  userIsAdmin: boolean
  onEntryUpdated?: () => void
}

export function ScoreEntryActions({ entry, scoreType, userIsAdmin, onEntryUpdated }: ScoreEntryActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [score, setScore] = useState(entry.score.toString())
  const [note, setNote] = useState(entry.note || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  if (!userIsAdmin) {
    return null
  }

  const handleEditOpen = (open: boolean) => {
    if (open) {
      setScore(entry.score.toString())
      setNote(entry.note || "")
      setError("")
      setSuccess("")
    }
    setEditOpen(open)
  }

  const handleUpdate = async () => {
    if (!score) {
      setError("점수를 입력해주세요.")
      return
    }

    const scoreValue = parseFloat(score)
    if (isNaN(scoreValue)) {
      setError("유효한 점수를 입력해주세요.")
      return
    }

    if (scoreType === 'time_seconds' && scoreValue <= 0) {
      setError("시간은 0보다 큰 값이어야 합니다.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/score-entries/${entry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: scoreValue,
          note: note.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update score entry')
      }

      setSuccess("점수가 성공적으로 수정되었습니다!")
      
      // 즉시 업데이트 콜백 호출
      if (onEntryUpdated) {
        onEntryUpdated()
      }
      
      // UI 피드백을 위한 지연된 모달 닫기
      setTimeout(() => {
        setEditOpen(false)
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : '점수 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/score-entries/${entry.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete score entry')
      }

      // 즉시 업데이트 콜백 호출
      if (onEntryUpdated) {
        onEntryUpdated()
      }

      setDeleteOpen(false)

    } catch (err) {
      setError(err instanceof Error ? err.message : '점수 삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatScoreDisplay = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return value
    
    if (scoreType === 'time_seconds') {
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

  const ScoreIcon = scoreType === 'points' ? Target : Clock

  return (
    <>
      <div className="flex gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleEditOpen(true)}
          className="h-8 px-2"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={editOpen} onOpenChange={handleEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScoreIcon className="h-5 w-5" />
              점수 수정
            </DialogTitle>
            <DialogDescription>
              점수와 메모를 수정할 수 있습니다.
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="score">
                점수 ({scoreType === 'points' ? '포인트' : '시간(초)'}) *
              </Label>
              <Input
                id="score"
                type="number"
                placeholder={scoreType === 'points' ? "예: 100" : "예: 125 (2분 5초)"}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                step={scoreType === 'time_seconds' ? '0.1' : '1'}
                min={scoreType === 'time_seconds' ? '0.1' : undefined}
              />
              {score && (
                <div className="text-sm text-gray-600">
                  미리보기: {formatScoreDisplay(score)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">메모 (선택사항)</Label>
              <Textarea
                id="note"
                placeholder="점수에 대한 메모..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={100}
              />
            </div>

            <div className="text-sm text-gray-500">
              최초 등록: {new Date(entry.created_at).toLocaleString('ko-KR')}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading || !score}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  수정 중...
                </>
              ) : (
                <>
                  <Edit2 className="mr-2 h-4 w-4" />
                  수정
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>점수 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>이 점수 기록을 삭제하시겠습니까?</div>
              <div className="p-3 bg-gray-50 border rounded">
                <div className="font-medium">
                  점수: {formatScoreDisplay(entry.score.toString())}
                </div>
                {entry.note && (
                  <div className="text-sm text-gray-600 mt-1">
                    메모: {entry.note}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  등록: {new Date(entry.created_at).toLocaleString('ko-KR')}
                </div>
              </div>
              <div className="text-red-600 font-medium">
                이 작업은 되돌릴 수 없습니다.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}