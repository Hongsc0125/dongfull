"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Target, Clock, TrendingUp, TrendingDown, BarChart3, Activity, Star } from 'lucide-react'
import { useLogger } from '@/utils/logger'

interface CreateEventFormProps {
  guildId: string
  creatorId: string
}

export function CreateEventForm({ guildId, creatorId }: CreateEventFormProps) {
  const router = useRouter()
  const logger = useLogger('CreateEventForm')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    scoreType: 'points' as 'points' | 'time_seconds',
    sortDirection: 'desc' as 'desc' | 'asc',
    scoreAggregation: 'sum' as 'sum' | 'average' | 'best'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    logger.formSubmit('create-event', { guildId, formData })
    
    if (!formData.eventName.trim()) {
      setError('이벤트 제목을 입력해주세요.')
      logger.warn('Validation failed: Empty event name')
      return
    }

    if (!formData.description.trim()) {
      setError('이벤트 설명을 입력해주세요.')
      logger.warn('Validation failed: Empty description')
      return
    }

    setIsLoading(true)
    setError('')

    const apiUrl = '/api/events'
    const requestData = {
      guildId,
      eventName: formData.eventName.trim(),
      description: formData.description.trim(),
      scoreType: formData.scoreType,
      creatorId,
      sortDirection: formData.sortDirection,
      scoreAggregation: formData.scoreAggregation
    }

    logger.info(`Sending create event request to ${apiUrl}`, { requestData })

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      logger.info(`API Response: ${response.status} ${response.statusText}`, {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        logger.error(`API Error: ${response.status}`, { errorData })
        throw new Error(errorData.error || 'Failed to create event')
      }

      const event = await response.json()
      logger.success('Event created successfully', { event })
      
      // 성공시 길드 페이지로 리다이렉트
      router.push(`/guild/${guildId}`)
    } catch (error) {
      logger.error('Error creating event', error as Error, { apiUrl, requestData })
      setError(error instanceof Error ? error.message : '이벤트 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreTypeIcon = (type: string) => {
    return type === 'points' ? Target : Clock
  }

  const getSortIcon = (direction: string) => {
    return direction === 'desc' ? TrendingDown : TrendingUp
  }

  const getAggregationIcon = (aggregation: string) => {
    switch (aggregation) {
      case 'sum': return BarChart3
      case 'average': return Activity
      case 'best': return Star
      default: return BarChart3
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="eventName">이벤트 제목 *</Label>
        <Input
          id="eventName"
          value={formData.eventName}
          onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
          placeholder="예: 스피드런 챌린지"
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">이벤트 설명 *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="이벤트에 대한 설명을 입력하세요"
          maxLength={500}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>점수 타입 *</Label>
          <Select 
            value={formData.scoreType} 
            onValueChange={(value: 'points' | 'time_seconds') => 
              setFormData(prev => ({ ...prev, scoreType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="points">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  포인트
                </div>
              </SelectItem>
              <SelectItem value="time_seconds">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  시간 (초)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>정렬 방식 *</Label>
          <Select 
            value={formData.sortDirection} 
            onValueChange={(value: 'desc' | 'asc') => 
              setFormData(prev => ({ ...prev, sortDirection: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  높은 순
                </div>
              </SelectItem>
              <SelectItem value="asc">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  낮은 순
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>집계 방식 *</Label>
          <Select 
            value={formData.scoreAggregation} 
            onValueChange={(value: 'sum' | 'average' | 'best') => 
              setFormData(prev => ({ ...prev, scoreAggregation: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sum">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  합산
                </div>
              </SelectItem>
              <SelectItem value="average">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  평균
                </div>
              </SelectItem>
              <SelectItem value="best">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  베스트
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview */}
      <Card className="bg-slate-50 dark:bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-sm">미리보기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {React.createElement(getScoreTypeIcon(formData.scoreType), { className: "h-4 w-4" })}
              <span>점수 타입: {formData.scoreType === 'points' ? '포인트' : '시간'}</span>
            </div>
            <div className="flex items-center gap-2">
              {React.createElement(getSortIcon(formData.sortDirection), { className: "h-4 w-4" })}
              <span>정렬: {formData.sortDirection === 'desc' ? '높은 순' : '낮은 순'}</span>
            </div>
            <div className="flex items-center gap-2">
              {React.createElement(getAggregationIcon(formData.scoreAggregation), { className: "h-4 w-4" })}
              <span>집계: {
                formData.scoreAggregation === 'sum' ? '합산' :
                formData.scoreAggregation === 'average' ? '평균' : '베스트'
              }</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              이벤트 생성
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/guild/${guildId}`)}
          disabled={isLoading}
        >
          취소
        </Button>
      </div>
    </form>
  )
}