"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Power, Loader2, AlertTriangle } from "lucide-react"

interface Event {
  id: number
  event_name: string
  is_active: boolean
}

interface EventToggleProps {
  event: Event
  userIsAdmin: boolean
}

export function EventToggle({ event, userIsAdmin }: EventToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!userIsAdmin) {
    return null
  }

  const handleToggle = async (newStatus: boolean) => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/events/${event.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: newStatus
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update event status')
      }

      // 성공시 페이지 새로고침
      router.refresh()
    } catch (error) {
      console.error('Error toggling event status:', error)
      setError(error instanceof Error ? error.message : '이벤트 상태 변경 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const toggleMessage = event.is_active 
    ? "이 이벤트를 비활성화하시겠습니까? 비활성화된 이벤트에는 더 이상 점수를 추가할 수 없습니다."
    : "이 이벤트를 활성화하시겠습니까? 활성화된 이벤트에 점수를 추가할 수 있습니다."

  const toggleAction = event.is_active ? "비활성화" : "활성화"

  return (
    <div className="space-y-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant={event.is_active ? "destructive" : "default"} 
            size="sm"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : event.is_active ? (
              <XCircle className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {loading ? "처리 중..." : `이벤트 ${toggleAction}`}
          </Button>
        </AlertDialogTrigger>
        
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              이벤트 상태 변경
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                <strong>{event.event_name}</strong> 이벤트의 상태를 변경합니다.
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  {event.is_active ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    현재 상태: {event.is_active ? "활성" : "비활성"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={!event.is_active} disabled />
                  <span className="text-sm">
                    변경 후: {!event.is_active ? "활성" : "비활성"}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {toggleMessage}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggle(!event.is_active)}
              disabled={loading}
              className={event.is_active ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                `${toggleAction} 확인`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}