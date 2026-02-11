import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    
    // 봇 상태 정보 가져오기
    const [statusResponse, guildsResponse] = await Promise.all([
      fetch(`${backendUrl}/api/bot/status`),
      fetch(`${backendUrl}/api/guilds`)
    ])

    const status = await statusResponse.json()
    const guilds = await guildsResponse.json()

    // 전체 이벤트 수 계산
    let totalEvents = 0
    let totalParticipants = 0
    
    for (const guild of guilds) {
      try {
        const eventsResponse = await fetch(`${backendUrl}/api/events/${guild.guild_id}`)
        const events = await eventsResponse.json()
        totalEvents += events.length
        
        // 각 이벤트의 참가자 수 합산
        for (const event of events) {
          const leaderboardResponse = await fetch(`${backendUrl}/api/leaderboard/${event.id}`)
          const leaderboard = await leaderboardResponse.json()
          totalParticipants += leaderboard.length
        }
      } catch (error) {
        console.warn(`Failed to fetch events for guild ${guild.guild_id}:`, error)
      }
    }

    const stats = {
      isOnline: status.online,
      guildCount: guilds.length,
      totalEvents,
      totalParticipants,
      uptime: status.uptime || '알 수 없음'
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching bot stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch bot stats',
      isOnline: false,
      guildCount: 0,
      totalEvents: 0,
      totalParticipants: 0,
      uptime: '알 수 없음'
    }, { status: 500 })
  }
}