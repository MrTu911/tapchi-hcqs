
/**
 * Web Push Notifications Library
 * Handles push notification subscriptions and sending
 */

import webpush from 'web-push'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
  }>
}

/**
 * Initialize web push configuration
 */
export function initializeWebPush() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@journal.edu.vn'

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  }
}

/**
 * Send push notification to a subscription
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  },
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    )
    return true
  } catch (error) {
    console.error('Failed to send push notification:', error)
    return false
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushNotificationPayload,
  prisma: any
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: { in: userIds },
      isActive: true
    }
  })

  let sent = 0
  let failed = 0

  for (const subscription of subscriptions) {
    const success = await sendPushNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys
      },
      payload
    )

    if (success) {
      sent++
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { lastUsedAt: new Date() }
      })
    } else {
      failed++
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { isActive: false }
      })
    }
  }

  return { sent, failed }
}

/**
 * Generate VAPID keys (run once for setup)
 */
export function generateVAPIDKeys() {
  const keys = webpush.generateVAPIDKeys()
  console.log('VAPID Public Key:', keys.publicKey)
  console.log('VAPID Private Key:', keys.privateKey)
  return keys
}
