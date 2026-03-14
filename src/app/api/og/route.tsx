import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Dynamic parameters
    const title = searchParams.get('title') || 'CineChive';
    const type = searchParams.get('type') || 'movie';
    const posterUrl = searchParams.get('poster');
    const backdropUrl = searchParams.get('backdrop');
    const year = searchParams.get('year');
    const rating = searchParams.get('rating');
    const sharer = searchParams.get('via');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Backdrop Gaussian Blur */}
          {backdropUrl && (
            <img
              src={backdropUrl}
              style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '120%',
                height: '120%',
                objectFit: 'cover',
                opacity: 0.3,
                filter: 'blur(40px)',
              }}
            />
          )}

          {/* Vignette Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 80%)',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '1000px',
              gap: '60px',
              zIndex: 10,
            }}
          >
            {/* Poster Card */}
            {posterUrl && (
              <div
                style={{
                  display: 'flex',
                  width: '380px',
                  height: '570px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <img
                  src={posterUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            {/* Content Area */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    padding: '6px 16px',
                    borderRadius: '40px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {type}
                </div>
                {year && (
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '24px', fontWeight: 500 }}>
                    {year}
                  </div>
                )}
              </div>

              <h1
                style={{
                  fontSize: title.length > 20 ? '72px' : '96px',
                  lineHeight: 1,
                  fontWeight: 900,
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '-0.04em',
                  fontStyle: 'italic',
                  textTransform: 'uppercase',
                }}
              >
                {title}
              </h1>

              {rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                  <div style={{ display: 'flex', color: '#fff', fontSize: '32px', fontWeight: 700 }}>
                    ★ {rating}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '24px' }}>
                    / 10
                  </div>
                </div>
              )}

              {/* Sharer Branding */}
              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {sharer && (
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '20px', letterSpacing: '0.05em' }}>
                    Curated by <span style={{ color: '#fff' }}>@{sharer}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '20px',
                  }}
                >
                  <div style={{ width: '32px', height: '32px', backgroundColor: '#fff', borderRadius: '8px' }} />
                  <div style={{ color: '#fff', fontSize: '24px', fontWeight: 900, letterSpacing: '0.2em' }}>
                    CINECHIVE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
