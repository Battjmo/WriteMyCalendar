// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import OpenAI from "npm:openai";

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  const { photo } = await req.json();
  const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });
  let openAIResponse = null;
  if (openai && photo && photo.base64) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "I have attached a notecard with my schedule for today on it. The date is in the top right corner. The schedule is left-aligned. Each line contains a start and end time, separated by a hyper, then a colon, then the task assigned to that time. Lines with mistakes are scribbled out. Please create the JSON object or objects that would be required to populate a Google Calendar, for the date provided, with this schedule. Don't include anything other than the JSON object. Each event should include a summary, start time object with a datetime and the Los Angeles timezone, and an end time object with same.",
            },
            {
              type: "image_url",
              image_url: { url: "data:image/jpeg;base64," + photo.base64 },
            },
          ],
        },
      ],
    });
    openAIResponse = await JSON.parse(
      response?.choices[0]?.message?.content?.slice(8, -3) || ""
    );
    console.log(openAIResponse);
  }

  return new Response(openAIResponse, {
    headers: { "Content-Type": "application/json" },
  });
});
