// app/api/share-card/[username]/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request, { params }) {
  const username = params.username;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Fetch candidate profile
    const { data: candidate } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url, country')
      .eq('username', username)
      .single();

    if (!candidate) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Generate SVG image
    const displayName = candidate.full_name || candidate.username;
    const avatarUrl = candidate.avatar_url || '';
    const country = candidate.country || '';
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
        <!-- Background -->
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#eab308;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#f97316;stop-opacity:0.15" />
            <stop offset="50%" style="stop-color:#eab308;stop-opacity:0.05" />
            <stop offset="100%" style="stop-color:#f97316;stop-opacity:0.15" />
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Glow effect -->
        <ellipse cx="600" cy="315" rx="400" ry="250" fill="url(#glow)"/>

        <!-- Border -->
        <rect x="20" y="20" width="1160" height="590" rx="20" fill="none" stroke="url(#accent)" stroke-width="2" opacity="0.3"/>

        <!-- Crown Icon -->
        <text x="600" y="120" font-family="Arial" font-size="48" text-anchor="middle" fill="#eab308">👑</text>

        <!-- Main Text -->
        <text x="600" y="200" font-family="Arial" font-weight="bold" font-size="52" text-anchor="middle" fill="#ffffff">
          ${displayName}
        </text>

        <text x="600" y="260" font-family="Arial" font-weight="bold" font-size="32" text-anchor="middle" fill="#f97316">
          CHALLENGES YOU!
        </text>

        <!-- Divider -->
        <line x1="300" y1="290" x2="900" y2="290" stroke="url(#accent)" stroke-width="2" opacity="0.5"/>

        <!-- Stats -->
        <text x="350" y="350" font-family="Arial" font-size="28" text-anchor="middle" fill="#ffffff" font-weight="bold">30</text>
        <text x="350" y="380" font-family="Arial" font-size="14" text-anchor="middle" fill="#888888">Housemates</text>

        <text x="600" y="350" font-family="Arial" font-size="28" text-anchor="middle" fill="#eab308" font-weight="bold">30</text>
        <text x="600" y="380" font-family="Arial" font-size="14" text-anchor="middle" fill="#888888">Days</text>

        <text x="850" y="350" font-family="Arial" font-size="28" text-anchor="middle" fill="#22c55e" font-weight="bold">1</text>
        <text x="850" y="380" font-family="Arial" font-size="14" text-anchor="middle" fill="#888888">Winner</text>

        <!-- CTA -->
        <text x="600" y="450" font-family="Arial" font-weight="bold" font-size="22" text-anchor="middle" fill="#ffffff">
          Think you have what it takes?
        </text>

        <!-- Button -->
        <rect x="450" y="480" width="300" height="50" rx="25" fill="url(#accent)"/>
        <text x="600" y="512" font-family="Arial" font-weight="bold" font-size="18" text-anchor="middle" fill="#000000">
          ACCEPT THE CHALLENGE
        </text>

        <!-- Footer -->
        <text x="600" y="590" font-family="Arial" font-size="14" text-anchor="middle" fill="#555555">
          Who Wins Reality Show
        </text>

        <!-- Corner decorations -->
        <rect x="40" y="40" width="30" height="4" rx="2" fill="url(#accent)"/>
        <rect x="40" y="40" width="4" height="30" rx="2" fill="url(#accent)"/>
        <rect x="1130" y="40" width="30" height="4" rx="2" fill="url(#accent)"/>
        <rect x="1160" y="40" width="4" height="30" rx="2" fill="url(#accent)"/>
        <rect x="40" y="586" width="30" height="4" rx="2" fill="url(#accent)"/>
        <rect x="40" y="560" width="4" height="30" rx="2" fill="url(#accent)"/>
        <rect x="1130" y="586" width="30" height="4" rx="2" fill="url(#accent)"/>
        <rect x="1160" y="560" width="4" height="30" rx="2" fill="url(#accent)"/>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    });
    
  } catch (error) {
    console.error('Error generating share card:', error);
    return new NextResponse('Error generating card', { status: 500 });
  }
}