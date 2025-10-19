"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Share2, Copy, Check, ExternalLink } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface ShareButtonProps {
  eventName: string
  eventId: number | string
  className?: string
}

export function ShareButton({ eventName, eventId, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [sharing, setSharing] = useState(false)
  
  const shareUrl = `${window.location.origin}/public/event/${eventId}`
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }
  
  const handleShare = () => {
    setIsOpen(true)
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      setSharing(true)
      try {
        await navigator.share({
          title: `🏆 ${eventName} 랭킹`,
          text: `${eventName} 이벤트의 실시간 랭킹을 확인해보세요!`,
          url: shareUrl,
        })
        setIsOpen(false) // 공유 성공 시 모달 닫기
      } catch (err) {
        console.log('Sharing failed:', err)
      } finally {
        setSharing(false)
      }
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={handleShare}
          className={className || "bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"}
          variant="outline"
        >
          <Share2 className="h-4 w-4 mr-2" />
          공유하기
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            랭킹 공유하기
          </DialogTitle>
          <DialogDescription>
            이 링크를 공유하면 누구나 실시간 랭킹을 볼 수 있습니다
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2">
          <Input 
            value={shareUrl}
            readOnly
            className="flex-1"
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
        
        <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(shareUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            새 탭에서 열기
          </Button>
          
{typeof navigator !== 'undefined' && 'share' in navigator && (
            <LoadingButton
              variant="outline"
              size="sm"
              onClick={handleNativeShare}
              loading={sharing}
              loadingText="공유 중..."
            >
              <Share2 className="h-4 w-4 mr-2" />
              공유
            </LoadingButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}