// app/api/paystack-webhook/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
// You will need to import your Supabase client here. 
// Use the SUPABASE_SERVICE_ROLE_KEY for webhooks to bypass RLS.
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Add this to Vercel!
);

export async function POST(req) {
  try {
    const body = await req.text();
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    // Verify the request is actually from Paystack
    if (hash !== req.headers.get('x-paystack-signature')) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // We only care about successful charges
    if (event.event === 'charge.success') {
      const { reference, metadata, amount, customer } = event.data;
      
      // Extract votes from metadata (we passed this in VoteModal)
      const votes = parseInt(metadata?.custom_fields?.find(f => f.variable_name === 'votes')?.value || '0');
      const candidateUsername = metadata?.custom_fields?.find(f => f.variable_name === 'candidate')?.value;

      if (votes > 0 && candidateUsername) {
        
        // 1. Check if vote was already recorded (to prevent duplicates)
        const { data: existingVote } = await supabaseAdmin
          .from('vote_transactions')
          .select('id')
          .eq('reference', reference)
          .maybeSingle();

        if (!existingVote) {
          // 2. Find candidate ID
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('username', candidateUsername)
            .single();

          if (profile) {
            // 3. Insert vote
            await supabaseAdmin.from('vote_transactions').insert({
              user_id: null, // Guest or user ID (webhook doesn't know auth state, optional)
              guest_email: customer.email,
              candidate_id: profile.id,
              package_name: `${votes} Votes Package`,
              votes: votes,
              price_per_vote: (amount / 100) / votes,
              total_amount: amount / 100, // Convert kobo to Naira
              payment_method: 'paystack',
              payment_id: reference,
              reference: reference,
              status: 'completed',
            });

            // 4. Increment vote count
            await supabaseAdmin.rpc('increment_votes', {
              candidate_id: profile.id,
              vote_count: votes
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}