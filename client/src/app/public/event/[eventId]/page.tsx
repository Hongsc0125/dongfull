import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicLeaderboard } from '@/components/public-leaderboard'

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
  guild_name?: string
}

interface Participant {
  rank: number
  user_id: string
  display_name: string
  total_score?: number
  calculated_score?: number
  entry_count: number
}

async function getPublicEventData(eventId: string): Promise<{
  event: Event | null,
  leaderboard: Participant[],
  stats: { participantCount: number, totalEntries: number }
}> {
  try {
    const response = await fetch(`http://localhost:3001/api/public/event/${eventId}`, {
      cache: 'no-store'
    })
    if (!response.ok) {
      return { event: null, leaderboard: [], stats: { participantCount: 0, totalEntries: 0 } }
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching public event data:', error)
    return { event: null, leaderboard: [], stats: { participantCount: 0, totalEntries: 0 } }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const { event } = await getPublicEventData(resolvedParams.eventId)
  
  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.'
    }
  }

  return {
    title: `${event.event_name} - 랭킹 리더보드`,
    description: `${event.event_name} 이벤트의 실시간 랭킹을 확인해보세요! ${event.description || ''}`.trim(),
    openGraph: {
      title: `🏆 ${event.event_name} 랭킹`,
      description: `실시간 리더보드 - ${event.description || '최고의 실력자는 누구일까요?'}`,
      type: 'website',
      locale: 'ko_KR'
    },
    twitter: {
      card: 'summary_large_image',
      title: `🏆 ${event.event_name}`,
      description: `실시간 랭킹 리더보드 - ${event.description || '최고의 실력자는 누구일까요?'}`
    },
    keywords: ['랭킹', '리더보드', '이벤트', event.event_name, '경쟁', '순위'],
    robots: 'index, follow'
  }
}

export default async function PublicEventPage({ 
  params 
}: { 
  params: Promise<{ eventId: string }> 
}) {
  const resolvedParams = await params
  const { event, leaderboard, stats } = await getPublicEventData(resolvedParams.eventId)

  if (!event) {
    notFound()
  }

  return (
    <PublicLeaderboard 
      event={event}
      leaderboard={leaderboard}
      stats={stats}
    />
  )
}