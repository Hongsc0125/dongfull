import { auth } from '../../../../../auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    console.log('Session debug:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasAccessToken: !!session?.accessToken,
      sessionKeys: session ? Object.keys(session) : null,
      userKeys: session?.user ? Object.keys(session.user) : null
    })
    
    if (!session?.accessToken) {
      console.log('No access token found in session')
      return NextResponse.json({ 
        error: 'Unauthorized', 
        debug: 'No access token in session' 
      }, { status: 401 })
    }

    // Discord API로부터 사용자 길드 정보 가져오기
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      console.error('Discord API error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      const errorText = await response.text()
      console.error('Discord API error body:', errorText)
      throw new Error(`Failed to fetch guilds: ${response.status} ${response.statusText}`)
    }

    const guilds = await response.json()
    
    // 봇이 있는 길드들만 필터링하기 위해 백엔드 API 호출
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/guilds`)
    const botGuilds = await backendResponse.json()
    
    const botGuildIds = new Set(botGuilds.map((guild: { guild_id: string }) => guild.guild_id))
    
    const filteredGuilds = guilds.filter((guild: { id: string }) => botGuildIds.has(guild.id))
    
    return NextResponse.json(filteredGuilds)
  } catch (error) {
    console.error('Error fetching user guilds:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}