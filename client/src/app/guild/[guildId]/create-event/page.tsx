import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, CheckCircle } from "lucide-react"
import { auth } from "../../../../../auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CreateEventForm } from "@/components/create-event-form"

interface Guild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
}

async function getGuildInfo(guildId: string): Promise<Guild | null> {
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3777'}/api/user/guilds`, {
      cache: 'no-store',
      headers: {
        cookie: headersList.get('cookie') || '',
      },
    })
    if (!response.ok) return null
    
    const guilds = await response.json()
    return guilds.find((g: Guild) => g.id === guildId) || null
  } catch {
    return null
  }
}

function isAdmin(guild: Guild) {
  const permissions = parseInt(guild.permissions)
  return (permissions & 0x8) === 0x8 || guild.owner
}

export default async function CreateEventPage({ 
  params 
}: { 
  params: Promise<{ guildId: string }> 
}) {
  const session = await auth()
  if (!session) {
    redirect('/')
  }

  const resolvedParams = await params
  const guild = await getGuildInfo(resolvedParams.guildId)
  
  if (!guild) {
    notFound()
  }

  if (!isAdmin(guild)) {
    redirect(`/guild/${resolvedParams.guildId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/guild/${resolvedParams.guildId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              서버로 돌아가기
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                새 이벤트 생성
              </CardTitle>
              <CardDescription>
                {guild.name}에서 새로운 랭킹 이벤트를 생성합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateEventForm 
                guildId={resolvedParams.guildId} 
                creatorId={session.user?.id || ''} 
              />
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>📝 이벤트 생성 가이드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">점수 타입</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <strong>포인트:</strong> 일반적인 점수 기반 이벤트 (게임 점수, 달성도 등)</li>
                    <li>• <strong>시간:</strong> 시간 기반 이벤트 (스피드런, 완주 시간 등)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">정렬 방식</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <strong>높은 순:</strong> 점수가 높을수록 상위 (일반적인 점수 이벤트)</li>
                    <li>• <strong>낮은 순:</strong> 점수가 낮을수록 상위 (시간 이벤트, 골프 등)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">집계 방식</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <strong>합산:</strong> 모든 점수를 더함 (총합 점수 경쟁)</li>
                    <li>• <strong>평균:</strong> 점수들의 평균값 (일관성 중시)</li>
                    <li>• <strong>베스트:</strong> 가장 좋은 기록만 반영 (최고 기록 경쟁)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}