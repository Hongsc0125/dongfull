import { auth } from '../../../../../auth'
import { NextRequest, NextResponse } from 'next/server'

// 간단한 메모리 캐시 (실제 운영환경에서는 Redis 등 사용 권장)
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5분 캐시

// Rate limit 처리를 위한 재시도 함수
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after')
        const resetAfter = response.headers.get('x-ratelimit-reset-after')

        // 재시도 대기 시간 계산 (초 단위)
        const waitTime = retryAfter ? parseFloat(retryAfter) : (resetAfter ? parseFloat(resetAfter) : 1)

        console.log(`Rate limited, waiting ${waitTime}s before retry (attempt ${attempt + 1}/${maxRetries})`)

        // 마지막 시도가 아니라면 대기 후 재시도
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
          continue
        }
      }

      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        console.log(`Request failed, retrying (attempt ${attempt + 1}/${maxRetries}):`, error)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))) // 점진적 대기
        continue
      }
    }
  }

  throw lastError!
}

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

    // 캐시 키 생성 (사용자별)
    const cacheKey = `guilds:${session.user?.discordId || session.accessToken.slice(-10)}`

    // 캐시 확인
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached guilds data')
      return NextResponse.json(cached.data)
    }

    // Discord API로부터 사용자 길드 정보 가져오기 (Rate Limit 처리 포함)
    const response = await fetchWithRetry('https://discord.com/api/users/@me/guilds', {
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

      let errorText = ''
      try {
        errorText = await response.text()
        console.error('Discord API error body:', errorText)
      } catch (e) {
        console.error('Failed to read error response body:', e)
      }

      // Rate limit 에러에 대한 사용자 친화적 메시지
      if (response.status === 429) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: '잠시 후 다시 시도해주세요. Discord API 요청 한도를 초과했습니다.',
          retryAfter: response.headers.get('retry-after') || '60'
        }, { status: 429 })
      }

      // 기타 Discord API 에러
      return NextResponse.json({
        error: 'Discord API error',
        message: 'Discord 서버와의 통신에 실패했습니다. 잠시 후 다시 시도해주세요.',
        status: response.status
      }, { status: response.status })
    }

    const guilds = await response.json()
    
    // 봇이 있는 길드들만 필터링하기 위해 백엔드 API 호출
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/guilds`)
    const botGuilds = await backendResponse.json()
    
    const botGuildIds = new Set(botGuilds.map((guild: { guild_id: string }) => guild.guild_id))
    
    const filteredGuilds = guilds.filter((guild: { id: string }) => botGuildIds.has(guild.id))

    // 결과를 캐시에 저장
    cache.set(cacheKey, {
      data: filteredGuilds,
      timestamp: Date.now()
    })

    console.log(`Cached ${filteredGuilds.length} guilds for user`)

    return NextResponse.json(filteredGuilds)
  } catch (error) {
    console.error('Error fetching user guilds:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}