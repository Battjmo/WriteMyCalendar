// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import OpenAI from "npm:openai";

//TODO MAKE PROMPT FOR CALENDAR SAY THAT THE DATE WILL INCLUDES SLASHES
const prompts: { [key: string]: string } = {
  googleCalendar:
    "I have attached a notecard with my schedule for today on it. The date is in the top right corner. The schedule is left-aligned. Each line contains a start and end time, separated by a hyper, then a colon, then the task assigned to that time. Lines with mistakes are scribbled out. Please create the JSON object or objects that would be required to populate a Google Calendar, for the date provided, with this schedule. Don't include anything other than the JSON object. Each event should include a summary, start time object with a datetime and the Los Angeles timezone, and an end time object with same.",
  appleCalendar:
    "I have attached a notecard with my schedule for today on it. The date is in the top right corner. The schedule is left-aligned. Each line contains a start and end time, separated by a hyper, then a colon, then the task assigned to that time. Lines with mistakes are scribbled out. Please create the JSON object or objects that would be required to populate an Apple Calendar, for the date provided, with this schedule. Don't include anything other than the JSON object. Each event should include a title, startDate, and endDate in ISO 8601 format with the Los Angeles timezone.",
  googleText:
    "I have attached a photo of a piece of paper with some handwritten notes on it. Please create the JSON Object or objects that would be required to create a text document in Google Drive and populate it with this information using the Google Drive API. The first line of the note should be used as the name of the document. Do not include that line in the body. Also always return the body as a string, not an object. Don't include anything other than the JSON object.",
  appleNotes:
    "I have attached a photo of a piece of paper with some handwritten notes on it. Please create the JSON Object that would be required to create a note in Apple Notes and populate it with this information. The first line of the note should be used as the title of the note. Do not include that line in the body. Return the JSON object with 'title' and 'body' fields, where 'body' is a string containing the note content. Don't include anything other than the JSON object.",
};

const defaultPrompt = prompts.googleCalendar;

Deno.serve(async (req) => {
  const { photo, mode, authMethod } = await req.json();
  //upload the image

  const promptKey = `${authMethod}${
    mode.charAt(0).toUpperCase() + mode.slice(1)
  }`;
  const prompt = prompts[promptKey] || defaultPrompt;
  console.log("🚀 ~ Deno.serve ~ mode:", mode, "authMethod:", authMethod);

  // Determine the response format based on the authMethod
  const isAppleFormat = authMethod === "apple";

  const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });
  let openAIResponse = null;
  if (openai && photo) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: "data:image/jpeg;base64," + photo,
                },
              },
            ],
          },
        ],
      });
      console.log("🚀 ~ Deno.serve ~ response:", response);
      const content = response?.choices[0]?.message?.content;
      if (content) {
        try {
          openAIResponse = (await JSON.parse(content.slice(8, -3))) || "";
        } catch (parseError) {
          console.error("openai parse error: ", parseError);
        }
        console.log("openai response: ", openAIResponse);
      }
    } catch (error) {
      console.error("openai error: ", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  }

  return new Response(JSON.stringify(openAIResponse), {
    status: 200,
    statusText: "success",
    headers: {
      "Content-Type": "application/json",
    },
  });
});
