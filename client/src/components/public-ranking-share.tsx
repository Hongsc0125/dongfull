"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check, ExternalLink, Globe } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface PublicRankingShareProps {
  eventName: string
  eventId: number
}

export function PublicRankingShare({ eventName, eventId }: PublicRankingShareProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/event/${eventId}`
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `🏆 ${eventName} 공개 랭킹`,
          text: `${eventName} 이벤트의 실시간 공개 랭킹을 확인해보세요! (로그인 없이 접근 가능)`,
          url: publicUrl,
        })
      } catch (err) {
        console.log('Sharing failed:', err)
      }
    } else {
      setIsOpen(true)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={handleShare}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          size="sm"
        >
          <Globe className="h-4 w-4 mr-2" />
          공개 랭킹 공유
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            공개 랭킹 페이지 공유
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>이 링크는 <strong>로그인 없이</strong> 누구나 볼 수 있는 공개 랭킹 페이지입니다</p>
            <Badge variant="secondary" className="text-xs">
              ✨ 실시간 업데이트 • 소셜 미디어 최적화 • 모바일 지원
            </Badge>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2">
          <Input 
            value={publicUrl}
            readOnly
            className="flex-1 text-sm"
          />
          <Button 
            size="sm" 
            onClick={handleCopy}
            variant={copied ? "default" : "outline"}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                복사
              </>
            )}
          </Button>
        </div>
        
        <div className="flex justify-center gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(publicUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            새 탭에서 미리보기
          </Button>
          
          {navigator.share && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigator.share({
                  title: `🏆 ${eventName} 공개 랭킹`,
                  text: `${eventName} 이벤트의 실시간 공개 랭킹을 확인해보세요!`,
                  url: publicUrl,
                })
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              네이티브 공유
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}