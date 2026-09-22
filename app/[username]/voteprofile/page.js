// app/[username]/voteprofile/page.js
import VoteProfileClient from './VoteProfileClient';
import { supabaseServer } from '../../../lib/supabase-server';

const BASE_URL = 'https://whowinshow.com';

export async function generateMetadata({ params }) {
  const username = params.username;
  const pageUrl = `${BASE_URL}/${username}/voteprofile`;

  try {
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('username, updated_at')
      .eq('username', username)
      .maybeSingle();

    const displayName = (profile?.username || username || 'CANDIDATE').toUpperCase();
    const title = `Vote for ${displayName} | Who Wins Reality Show Season 2`;

    // Short description shown under the preview image in WhatsApp/Facebook.
    // Kept tight so WhatsApp doesn't truncate it awkwardly.
    const description = `Hello, I am participating in the Who Wins Reality Show Season 2. Please help vote for me — I need votes to qualify. Click to vote for ${displayName} on whowinshow.com.`;

    const version = profile?.updated_at
      ? new Date(profile.updated_at).getTime()
      : Date.now();

    const ogImageUrl = `${BASE_URL}/api/vote-card/${username}?v=${version}`;

    return {
      title,
      description,
      metadataBase: new URL(BASE_URL),
      alternates: { canonical: pageUrl },
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: 'Who Wins Reality Show',
        type: 'website',
        locale: 'en_US',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `Vote for ${displayName}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (err) {
    console.error('generateMetadata error:', err);
    return {
      title: 'Vote on Who Wins Reality Show Season 2',
      description: 'Cast your vote and support your favourite candidate on Who Wins Reality Show Season 2.',
    };
  }
}

export default function VoteProfilePage() {
  return <VoteProfileClient />;
}