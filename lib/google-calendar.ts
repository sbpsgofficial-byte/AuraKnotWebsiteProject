import { google } from 'googleapis';
import { Quotation } from '@/types';

function getAuth() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('Google Service Account credentials not configured');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

export async function createCalendarEvent(quotation: Quotation, customerName: string): Promise<string | null> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: `Aura Knot - ${quotation.eventType} - ${customerName}`,
      description: `Quotation ID: ${quotation.quotationId}\nEvent Type: ${quotation.eventType}\nLocation: ${quotation.location}`,
      start: {
        dateTime: new Date(quotation.eventDateStart).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(quotation.eventDateEnd).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      location: quotation.location,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 24 * 60 },
          { method: 'email', minutes: 60 }, // 1 hour before
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    return response.data.id || null;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

export async function updateCalendarEvent(eventId: string, quotation: Quotation, customerName: string): Promise<boolean> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: `Aura Knot - ${quotation.eventType} - ${customerName}`,
      description: `Quotation ID: ${quotation.quotationId}\nEvent Type: ${quotation.eventType}\nLocation: ${quotation.location}`,
      start: {
        dateTime: new Date(quotation.eventDateStart).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(quotation.eventDateEnd).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      location: quotation.location,
    };

    await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId,
      requestBody: event,
    });

    return true;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}
