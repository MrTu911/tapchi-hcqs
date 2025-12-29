
export const dynamic = "force-dynamic"

/**
 * ORCID OAuth Callback Handler
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import {
  getORCIDConfig,
  getORCIDAccessToken,
  fetchORCIDProfile
} from '@/lib/integrations/orcid'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/profile?error=missing_code', request.url)
      )
    }

    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.redirect(
        new URL('/auth/login', request.url)
      )
    }

    const config = getORCIDConfig()

    // Exchange code for access token
    const tokenData = await getORCIDAccessToken(code, config)

    // Fetch ORCID profile
    const profile = await fetchORCIDProfile(
      tokenData.orcid,
      tokenData.access_token,
      config
    )

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: session.uid }
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/dashboard/profile?error=user_not_found', request.url)
      )
    }

    // Save or update ORCID profile
    await prisma.oRCIDProfile.upsert({
      where: { userId: user.id },
      update: {
        orcidId: profile.orcidId,
        fullName: profile.fullName,
        biography: profile.biography,
        affiliations: profile.affiliations,
        works: profile.works,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        lastSyncAt: new Date()
      },
      create: {
        userId: user.id,
        orcidId: profile.orcidId,
        fullName: profile.fullName,
        biography: profile.biography,
        affiliations: profile.affiliations,
        works: profile.works,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        lastSyncAt: new Date()
      }
    })

    return NextResponse.redirect(
      new URL('/dashboard/profile?orcid=connected', request.url)
    )
  } catch (error) {
    logger.error({ message: 'ORCID callback error:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.redirect(
      new URL('/dashboard/profile?error=orcid_failed', request.url)
    )
  }
}
