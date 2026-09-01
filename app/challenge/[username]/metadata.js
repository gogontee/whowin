// app/challenge/[username]/metadata.js
import { createClient } from '@supabase/supabase-js';

export async function generateMetadata({ params }) {
  const username = params.username;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Fetch candidate profile
  const { data: candidate } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, country')
    .eq('username', username)
    .single();

  if (!candidate) {
    return {
      title: 'Challenge | Who Wins Reality Show',
      description: 'Join the Who Wins Reality Show challenge.',
    };
  }

  const displayName = candidate.full_name || candidate.username;
  const shareImageUrl = `https://whowinshow.com/api/share-card/${username}`;

  return {
    title: `${displayName} challenges you to Who Wins Reality Show! 🔥`,
    description: `${displayName} is challenging you to join Who Wins Reality Show. 30 Housemates. 30 Days. 1 Mansion. 1 Winner. Think you have what it takes?`,
    keywords: `Who Wins, Reality Show, ${displayName}, Challenge, Competition, Nigeria, Africa`,
    openGraph: {
      title: `${displayName} challenges you to Who Wins! 🔥`,
      description: `Accept the challenge and join Who Wins Reality Show. 30 Housemates. 30 Days. 1 Mansion. 1 Winner.`,
      images: [
        {
          url: shareImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName} challenges you to Who Wins`,
        },
      ],
      type: 'website',
      url: `https://whowinshow.com/challenge/${username}`,
      siteName: 'Who Wins Reality Show',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} challenges you to Who Wins Reality Show! 🔥`,
      description: `Accept the challenge and join Who Wins Reality Show. 30 Housemates. 30 Days. 1 Mansion. 1 Winner.`,
      images: [shareImageUrl],
      creator: '@whowinshow',
    },
  };
}