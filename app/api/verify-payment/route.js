// app/api/verify-payment/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    if (data.data.status !== 'success') {
      return NextResponse.json({ 
        error: `Transaction status is ${data.data.status}. If you paid via transfer, please wait a moment.` 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error('Paystack verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}