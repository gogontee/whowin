// app/api/paystack-webhook/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.text();

    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    if (hash !== req.headers.get('x-paystack-signature')) {
      console.error('[WEBHOOK] Invalid signature — rejecting');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('[WEBHOOK] Received event:', event.event, 'ref:', event.data?.reference);

    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true, ignored: true });
    }

    const { reference, metadata, amount, customer } = event.data;

    const votes = parseInt(
      metadata?.custom_fields?.find(f => f.variable_name === 'votes')?.value || '0',
      10
    );
    const candidateUsername = metadata?.custom_fields?.find(f => f.variable_name === 'candidate')?.value;

    console.log('[WEBHOOK] Parsed:', { reference, votes, candidateUsername, amount });

    if (!votes || !candidateUsername) {
      console.error('[WEBHOOK] Missing votes or candidate metadata — skipping');
      return NextResponse.json({ received: true, skipped: 'missing metadata' });
    }

    // 1. Check if already inserted (frontend may have beaten us to it)
    const { data: existingVote, error: checkErr } = await supabaseAdmin
      .from('vote_transactions')
      .select('id')
      .eq('reference', reference)
      .maybeSingle();

    if (checkErr) {
      console.error('[WEBHOOK] Error checking existing vote:', checkErr);
      return NextResponse.json({ error: 'DB check failed' }, { status: 500 });
    }

    if (existingVote) {
      console.log('[WEBHOOK] Vote already recorded — skipping duplicate');
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 2. Find candidate
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', candidateUsername)
      .maybeSingle();

    if (profileErr || !profile) {
      console.error('[WEBHOOK] Candidate not found:', candidateUsername, profileErr);
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // 3. Insert vote — use .select() to CONFIRM it was written
    const { data: insertedRows, error: insertError } = await supabaseAdmin
      .from('vote_transactions')
      .insert({
        user_id: null,
        guest_email: customer.email,
        candidate_id: profile.id,
        package_name: `${votes} Votes Package`,
        votes: votes,
        price_per_vote: (amount / 100) / votes,
        total_amount: amount / 100,
        payment_method: 'paystack',
        payment_provider: 'paystack',
        payment_id: reference,
        reference: reference,
        status: 'completed',
        metadata: { source: 'webhook' },
      })
      .select('id, votes'); // <-- CONFIRM INSERT

    if (insertError) {
      console.error('[WEBHOOK] Insert failed:', insertError);
      return NextResponse.json({ error: 'Insert failed', details: insertError.message }, { status: 500 });
    }

    if (!insertedRows || insertedRows.length === 0) {
      console.error('[WEBHOOK] Insert returned 0 rows — likely RLS blocking (service role key is wrong)');
      return NextResponse.json({ error: 'RLS blocked insert' }, { status: 500 });
    }

    console.log('[WEBHOOK] Vote inserted successfully:', insertedRows[0]);

    // 4. Increment candidate vote count — only AFTER confirmed insert
    const { error: rpcErr } = await supabaseAdmin.rpc('increment_votes', {
      candidate_id: profile.id,
      vote_count: votes,
    });

    if (rpcErr) {
      console.error('[WEBHOOK] increment_votes RPC failed:', rpcErr);
      // Don't fail the webhook — the vote row exists, count will reconcile on next fetch
    } else {
      console.log('[WEBHOOK] Vote count incremented by', votes);
    }

    return NextResponse.json({ received: true, inserted: true });
  } catch (error) {
    console.error('[WEBHOOK] Fatal error:', error);
    return NextResponse.json({ error: 'Webhook failed', details: error.message }, { status: 500 });
  }
}