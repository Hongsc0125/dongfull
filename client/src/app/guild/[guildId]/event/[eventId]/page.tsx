import { auth } from "../../../../../../auth"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { RealTimeEventDetail } from "@/components/real-time-event-detail"

interface Event {
  id: number
  event_name: string
  description: string
  guild_id: string
  score_type: 'points' | 'time_seconds'
  sort_direction: 'asc' | 'desc'
  score_aggregation: 'sum' | 'average' | 'best'
  is_active: boolean
  created_at: string
  creator_id: string
}

interface Participant {
  rank: number
  user_id: string
  display_name: string
  total_score?: number
  calculated_score?: number
  entry_count: number
  entries?: ScoreEntry[]
}

interface ScoreEntry {
  id: number
  score: number
  created_at: string
  added_by: string
}

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

// 이벤트 상세정보와 리더보드를 한번에 가져오는 최적화된 함수
async function getEventDetail(eventId: string): Promise<{
  event: Event | null,
  leaderboard: Participant[],
  stats: { participantCount: number, totalEntries: number }
}> {
  try {
    const response = await fetch(`http://localhost:3001/api/event-detail/${eventId}/full`, {
      cache: 'no-store'
    })
    if (!response.ok) {
      return { event: null, leaderboard: [], stats: { participantCount: 0, totalEntries: 0 } }
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching event detail:', error)
    return { event: null, leaderboard: [], stats: { participantCount: 0, totalEntries: 0 } }
  }
}

function isAdmin(guild: Guild) {
  const permissions = parseInt(guild.permissions)
  return (permissions & 0x8) === 0x8 || guild.owner
}

export default async function EventDetailPage({ 
  params 
}: { 
  params: Promise<{ guildId: string; eventId: string }> 
}) {
  const session = await auth()
  if (!session) {
    redirect('/')
  }

  const resolvedParams = await params
  const [guild, eventDetail] = await Promise.all([
    getGuildInfo(resolvedParams.guildId),
    getEventDetail(resolvedParams.eventId)
  ])
  
  const { event, leaderboard, stats } = eventDetail


  if (!guild || !event) {
    notFound()
  }

  const userIsAdmin = isAdmin(guild)

  return (
    <RealTimeEventDetail
      guildId={resolvedParams.guildId}
      eventId={resolvedParams.eventId}
      initialEvent={event}
      initialLeaderboard={leaderboard}
      initialStats={stats}
      userIsAdmin={userIsAdmin}
    />
  )
}