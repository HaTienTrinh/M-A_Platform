// /app/api/google-calendar/callback/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getGoogleOAuthClient } from '@/lib/google-calendar';
import { encrypt } from '@/lib/crypto';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return callbackResponse(`Error: ${error}`);
  }

  if (!code) {
    return callbackResponse('Missing authorization code');
  }

  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return callbackResponse('Unauthorized');
    }

    const redirectUri = `${origin}/api/google-calendar/callback`;
    const oauth2Client = getGoogleOAuthClient(redirectUri);
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    if (!userInfo.email) {
      throw new Error('Could not retrieve Google email');
    }

    // Encrypt tokens
    const encryptedAccess = encrypt(tokens.access_token!);
    // Refresh token is only sent on first consent or if prompt=consent
    const encryptedRefresh = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

    // Update or Insert integration
    const updateData: any = {
      user_id: user.id,
      provider: 'google',
      access_token: encryptedAccess,
      expires_at: tokens.expiry_date,
      calendar_email: userInfo.email,
      updated_at: new Date().toISOString()
    };

    if (encryptedRefresh) {
      updateData.refresh_token = encryptedRefresh;
    }

    const { error: upsertError } = await supabase
      .from('user_integrations')
      .upsert(updateData, { onConflict: 'user_id,provider' });

    if (upsertError) throw upsertError;

    return callbackResponse(null, true);

  } catch (err: any) {
    console.error('Google Calendar callback error:', err);
    return callbackResponse(err.message || 'Callback transformation failed');
  }
}

function callbackResponse(error: string | null = null, success: boolean = false) {
  return new Response(`
    <html>
      <body style="background: #09090b; color: #71717a; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center; background: #18181b; padding: 2rem; border-radius: 1rem; border: 1px border #27272a; max-width: 400px;">
          ${success ? `
            <h2 style="color: #10b981; margin-bottom: 1rem;">Connection Successful!</h2>
            <p>Your Google Calendar has been connected to DealFlow.</p>
            <p style="font-size: 0.875rem; color: #52525b; margin-top: 1.5rem;">This window will close automatically...</p>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
                  window.close();
                } else {
                  window.location.href = '/settings';
                }
              }, 2000);
            </script>
          ` : `
            <h2 style="color: #ef4444; margin-bottom: 1rem;">Connection Failed</h2>
            <p>${error || 'An unexpected error occurred.'}</p>
            <button onclick="window.close()" style="margin-top: 1.5rem; background: #27272a; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">Close Window</button>
          `}
        </div>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
