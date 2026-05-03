/**
 * /api/update-plan
 *
 * Serverless function (Vercel / Netlify compatible).
 * Called from the client after a successful PayPal subscription payment.
 *
 * Updates the user's Clerk publicMetadata with their new plan.
 *
 * ⚠️  SECURITY NOTE:
 * In production, you should ALSO verify the PayPal subscription status
 * server-side before trusting the client's subscriptionId.
 * See: https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_get
 *
 * For MVP this does a direct update, which is acceptable for initial launch.
 */

export const config = { runtime: 'edge' } // Vercel Edge Function

interface UpdatePlanBody {
  userId: string
  plan: 'free' | 'plus' | 'pro'
  billing: 'monthly' | 'annual' | 'lifetime'
  expires: string | null
  subscriptionId: string
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
  if (!CLERK_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing CLERK_SECRET_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: UpdatePlanBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { userId, plan, billing, expires, subscriptionId } = body

  if (!userId || !plan || !billing || !subscriptionId) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Optional: Verify PayPal subscription is active
  // Uncomment and configure if you want server-side PayPal verification:
  //
  // const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
  // const PAYPAL_SECRET = process.env.PAYPAL_SECRET
  // const isValid = await verifyPayPalSubscription(subscriptionId, PAYPAL_CLIENT_ID, PAYPAL_SECRET)
  // if (!isValid) {
  //   return new Response(JSON.stringify({ error: 'Invalid subscription' }), { status: 400 })
  // }

  // Update Clerk publicMetadata via REST API
  try {
    const clerkRes = await fetch(
      `https://api.clerk.com/v1/users/${userId}/metadata`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: {
            plan,
            billing,
            expires,
            paypalSubscriptionId: subscriptionId,
            upgradedAt: new Date().toISOString(),
          },
        }),
      }
    )

    if (!clerkRes.ok) {
      const errorBody = await clerkRes.text()
      console.error('Clerk API error:', clerkRes.status, errorBody)
      return new Response(JSON.stringify({ error: 'Failed to update user plan', details: errorBody }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, plan, billing }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Update plan error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
