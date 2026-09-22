// app/api/vote-card/[username]/route.js
import { ImageResponse } from 'next/og';
import { supabaseServer } from '../../../../lib/supabase-server';

export const runtime = 'edge';

export async function GET(request, { params }) {
  const username = params.username;

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('username, avatar_url, country, updated_at')
    .eq('username', username)
    .maybeSingle();

  const displayName = (profile?.username || username || 'CANDIDATE').toUpperCase();
  const avatarUrl = profile?.avatar_url || '';
  const country = profile?.country || '';

  // Load the site logo as base64 so satori can inline it
  const logoUrl = 'https://whowinshow.com/logo.png';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #000000 0%, #111111 50%, #0a0a0a 100%)',
          padding: '40px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Outer golden border */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            border: '3px solid #C58B2A',
            borderRadius: '32px',
            padding: '30px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.4) 100%)',
          }}
        >
          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 56,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '2px',
              marginBottom: 24,
            }}
          >
            VOTE&nbsp;
            <span style={{ color: '#C58B2A' }}>{displayName}</span>
          </div>

          {/* Candidate photo */}
          <div
            style={{
              display: 'flex',
              width: 280,
              height: 280,
              borderRadius: 24,
              overflow: 'hidden',
              border: '3px solid rgba(255,255,255,0.15)',
              background: '#1a1a1a',
              marginBottom: 24,
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: 72,
                  fontWeight: 800,
                }}
              >
                {displayName.charAt(0)}
              </div>
            )}
          </div>

          {/* Action buttons row */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 4,
            }}
          >
            {/* Vote Now */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 32px',
                background: 'linear-gradient(90deg, #C58B2A 0%, #FBBF24 100%)',
                color: '#000000',
                fontSize: 24,
                fontWeight: 800,
                borderRadius: 16,
                letterSpacing: '0.5px',
              }}
            >
              ❤️  Vote Now
            </div>

            {/* Send Gift */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 32px',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                fontSize: 24,
                fontWeight: 800,
                borderRadius: 16,
                border: '2px solid rgba(255,255,255,0.2)',
                letterSpacing: '0.5px',
              }}
            >
              🎁  Send Gift
            </div>
          </div>

          {/* Country + brand line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 24,
              fontSize: 18,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '3px',
            }}
          >
            {country ? `${country} • ` : ''}WHO WINS REALITY SHOW
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}