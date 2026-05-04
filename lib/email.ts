import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export type EmailType = 
  | 'new_buyer_interested' 
  | 'nda_approved' 
  | 'new_message' 
  | 'new_discussion_message'
  | 'mention'
  | 'new_offer'
  | 'new_offer_response' 
  | 'deal_approved' 
  | 'kyc_updated'
  | 'meeting_proposed'
  | 'meeting_updated';

function getEmailTemplate(type: EmailType, data: any) {
  switch (type) {
    case 'new_buyer_interested':
      return {
        subject: `New interest in your deal: ${data.dealTitle}`,
        html: `<p>A new buyer has requested an NDA for your deal <strong>${data.dealTitle}</strong>.</p><p><a href="${data.url}">Log in</a> to review the request.</p>`
      };
    case 'nda_approved':
      return {
        subject: `NDA Approved for ${data.dealTitle}`,
        html: `<p>Good news! Your NDA for <strong>${data.dealTitle}</strong> has been approved. You can now access the data room and negotiation tools.</p><p><a href="${data.url}">View Deal</a></p>`
      };
    case 'new_message':
      return {
        subject: `New message regarding ${data.dealTitle}`,
        html: `<p>You have received a new message regarding the deal <strong>${data.dealTitle}</strong>.</p><p><a href="${data.url}">Reply in Negotiate Room</a></p>`
      };
    case 'new_offer':
      return {
        subject: `New Offer Received: ${data.dealTitle}`,
        html: `<p>You have received a new offer regarding the deal <strong>${data.dealTitle}</strong>.</p><p><a href="${data.url}">Review Offer</a></p>`
      };
    case 'new_offer_response':
      return {
        subject: `Offer Update: ${data.dealTitle}`,
        html: `<p>There has been a response to an offer regarding <strong>${data.dealTitle}</strong>.</p><p><a href="${data.url}">Review Offer</a></p>`
      };
    case 'deal_approved':
      return {
        subject: `Your deal is now live: ${data.dealTitle}`,
        html: `<p>Your deal listing <strong>${data.dealTitle}</strong> has successfully passed review and is now live on the platform!</p><p><a href="${data.url}">View Listing</a></p>`
      };
    case 'kyc_updated':
      return {
        subject: `KYC Status Updated: ${data.status}`,
        html: `<p>Your KYC status has been updated to: <strong>${data.status}</strong>.</p>`
      };
    case 'meeting_proposed':
      return {
        subject: `New Meeting Proposed: ${data.dealTitle}`,
        html: `<p>A new meeting has been proposed for the deal <strong>${data.dealTitle}</strong>.</p><p><a href="${data.url}">View Meeting</a></p>`
      };
    case 'meeting_updated':
      return {
        subject: `Meeting Update: ${data.dealTitle}`,
        html: `<p>There is an update to a scheduled meeting for <strong>${data.dealTitle}</strong>.</p><p><a href="${data.url}">View Meeting</a></p>`
      };
    default:
      return {
        subject: `Update from DealFlow`,
        html: `<p>You have a new notification on DealFlow.</p>`
      };
  }
}

export async function sendEmailNotification(to: string, type: EmailType, data: any) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Dev] Skipping email send (No API Key). Email Details:', { to, type, data });
    return;
  }

  const template = getEmailTemplate(type, data);

  try {
    const { data: result, error } = await resend.emails.send({
      from: 'DealFlow <notifications@dealflow.example.com>',
      to,
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      console.error('Resend Error:', error);
    }
  } catch (err) {
    console.error('Email send failed:', err);
  }
}
