
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { addMonths } from 'date-fns';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    console.error('Razorpay webhook secret is not set.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const text = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
  }
  
  try {
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(text);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
    
    const event = JSON.parse(text);

    if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const userId = payment.notes?.userId;

        if (!userId) {
            console.error('Webhook Error: userId not found in payment notes.', payment);
            return NextResponse.json({ status: 'ok' });
        }

        const subscriptionEndsAt = addMonths(new Date(), 1).toISOString();

        const { error: updateErr } = await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'active',
            subscribed_at: new Date().toISOString(),
            subscription_ends_at: subscriptionEndsAt,
          })
          .eq('uid', userId);
        if (updateErr) {
          console.error('Failed updating user subscription:', updateErr);
        }

        // Optional: insert into payments if a table exists
        const paymentRecord = {
          user_uid: userId,
          payment_id: payment.id,
          order_id: payment.order_id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          created_at: new Date(payment.created_at * 1000).toISOString(),
        } as any;

        try {
          const { error: payErr } = await supabaseAdmin.from('payments').insert(paymentRecord);
          if (payErr) {
            // If payments table does not exist or RLS blocks, log and continue
            console.warn('Skipping payment insert:', payErr.message);
          }
        } catch (e) {
          console.warn('Payments table not available; skipping insert.');
        }

        console.log(`Successfully updated subscription for user: ${userId}`);
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Webhook handler failed', details: errorMessage }, { status: 500 });
  }
}
