// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
// import { calendar } from "npm:@googleapis/calendar";
import { google } from "npm:googleapis";

Deno.serve(async (req: any) => {
  const event = {
    summary: "Google I/O 2015",
    location: "800 Howard St., San Francisco, CA 94103",
    description: "A chance to hear more about Google's developer products.",
    start: {
      dateTime: "2024-06-29T09:00:00-07:00",
      timeZone: "America/Los_Angeles",
    },
    end: {
      dateTime: "2024-06-29T17:00:00-07:00",
      timeZone: "America/Los_Angeles",
    },
    recurrence: ["RRULE:FREQ=DAILY;COUNT=2"],
    attendees: [{ email: "bacheeze@gmail.com" }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };

  console.log(Deno.env.get("EXPO_PUBLIC_OPENAI_API_KEY"));
  const body = await req.json();
  const token = body.googleToken;
  console.log(req.body.events);

  const insertedEvent = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/bacheeze@gmail.com/events",
    {
      method: "POST",
      headers: {
        type: "application/json; charset=UTF-8",
        Authorization: `Bearer ${token}`,
      },
      body: req.body.events,
    }
  );

  const eventResponse = await insertedEvent.json();

  return new Response(JSON.stringify({ message: eventResponse }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/populateCalendar' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
