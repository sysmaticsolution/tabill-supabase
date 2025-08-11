
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not defined in environment variables');
}

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request: Request) {
  try {
    const { amount, currency, userId } = await request.json();

    if (!amount || !currency || !userId) {
        return NextResponse.json({ error: 'Missing required parameters: amount, currency, or userId' }, { status: 400 });
    }
    
    const receiptId = `sub_${String(userId).substring(0, 8)}_${Date.now()}`;

    const notes: { [key: string]: string | number | undefined } = {
        userId: userId,
        type: 'subscription'
    };
    
    try {
        const { data: userRow } = await supabaseAdmin
          .from('users')
          .select('name, email')
          .eq('uid', userId)
          .maybeSingle();
        if (userRow) {
          notes.customer_name = userRow.name;
          notes.customer_email = userRow.email || undefined;
        }
    } catch(e) {
        console.warn('Could not fetch user details for Razorpay order, proceeding without them.', e);
    }

    const options = {
        amount: amount,
        currency: currency,
        receipt: receiptId,
        notes: notes
    } as const;
    
    const order = await razorpay.orders.create(options as any);
    
    if (!order) {
        console.error('Razorpay order creation failed: No order returned from Razorpay.');
        return NextResponse.json({ error: 'Razorpay failed to create an order.' }, { status: 500 });
    }

    return NextResponse.json(order);

  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);
    const errorMessage = error.error?.description || error.message || 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to create Razorpay order.', details: errorMessage },
      { status: 500 }
    );
  }
}
