import { google } from 'googleapis';
import { decrypt, encrypt } from './crypto';

export function getGoogleOAuthClient(redirectUri?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/api/google-calendar/callback`
  );
}

export function getAuthUrl(redirectUri?: string) {
  const oauth2Client = getGoogleOAuthClient(redirectUri);
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

/**
 * Gets a Google OAuth client for a specific user, handling token refreshing and decryption
 */
export async function getClientForUser(supabase: any, userId: string) {
  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !integration) return null;

  const oauth2Client = getGoogleOAuthClient();
  
  const accessToken = decrypt(integration.access_token);
  const refreshToken = decrypt(integration.refresh_token);

  if (!accessToken || !refreshToken) return null;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: Number(integration.expires_at)
  });

  // Check if expired and refresh if needed
  const isExpired = Date.now() >= (Number(integration.expires_at) - 60000); // 1 minute buffer
  
  if (isExpired) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      const encryptedAccess = encrypt(credentials.access_token!);
      const encryptedRefresh = encrypt(credentials.refresh_token || refreshToken); 

      await supabase
        .from('user_integrations')
        .update({
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          expires_at: credentials.expiry_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id);
    } catch (refreshErr) {
      console.error('Failed to refresh Google token:', refreshErr);
      return null;
    }
  }

  return oauth2Client;
}

export async function createMeetingEvent(
  oauth2Client: any, 
  meeting: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    isMeetRequired: boolean;
  }
) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event: any = {
    summary: meeting.title,
    description: meeting.description || 'DealFlow Meeting',
    start: {
      dateTime: meeting.startTime,
    },
    end: {
      dateTime: meeting.endTime,
    },
    attendees: meeting.attendees.map(email => ({ email })),
  };

  if (meeting.isMeetRequired) {
    event.conferenceData = {
      createRequest: {
        requestId: `dealflow-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    };
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all'
  });

  return {
    eventId: res.data.id,
    meetLink: res.data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri
  };
}
