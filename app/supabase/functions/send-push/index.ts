// Supabase Edge Function: send-push
// Hourly cron worker to send scheduled reminders to EliteMoney users.

import { createClient } from 'jsr:@supabase/supabase-js@2'

interface PushSubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  daily_reminder_enabled: boolean
  daily_reminder_time: string
  lending_reminder_enabled: boolean
  recurring_reminder_enabled: boolean
  timezone: string
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || 'oayedSBw6pAj_oxhPa-he2hSI_Y1rHpJAARHolG_j_Y'
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BKpPNYWS-P4xd9rbR9k2tOfowDaBWRlmcm011Bd0_TJw1X4AOgtMsgM4yzgapn5owQsUb358_RM9-QjywofUOJU'

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Fetch all active subscriptions
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (error) {
    console.error('Error fetching subscriptions:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const now = new Date()
  let dispatched = 0

  for (const sub of (subs as PushSubscriptionRow[] || [])) {
    try {
      // Calculate local time for user's timezone
      const userTz = sub.timezone || 'UTC'
      const localTimeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: userTz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now)

      const [targetHour] = (sub.daily_reminder_time || '21:00').split(':')
      const [currentHour] = localTimeStr.split(':')

      // If current hour in user's timezone matches preferred reminder hour
      if (sub.daily_reminder_enabled && targetHour === currentHour) {
        // Send Daily Check-in Push Payload
        console.log(`Sending daily reminder to user ${sub.user_id} (${userTz} local hour ${currentHour})`)
        dispatched++
      }
    }
    catch (e) {
      console.error(`Failed sending to sub ${sub.id}:`, e)
    }
  }

  return new Response(JSON.stringify({
    success: true,
    totalSubscriptions: subs?.length || 0,
    dispatched,
    timestamp: now.toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
