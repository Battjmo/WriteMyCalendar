// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { JigsawStack } from "npm:jigsawstack";

//TODO MAKE PROMPT FOR CALENDAR SAY THAT THE DATE WILL INCLUDES SLASHES
const prompts: { [key: string]: string } = {
  calendar:
    "I have attached a notecard with my schedule for today on it. The date is in the top right corner. The schedule is left-aligned. Each line contains a start and end time, separated by a hyper, then a colon, then the task assigned to that time. Lines with mistakes are scribbled out. Please create the JSON object or objects that would be required to populate a Google Calendar, for the date provided, with this schedule. Don't include anything other than the JSON object. Each event should include a summary, start time object with a datetime and the Los Angeles timezone, and an end time object with same.",
  text: "I have attached a photo of a piece of paper with some handwritten notes on it. Please create the JSON Object or objects that would be required to create a text document in Google Drive and populate it with this information using the Google Drive API. The first line of the note should be used as the name of the document. Do not include that line in the body. Also always return the body as a string, not an object. Don't include anything other than the JSON object.",
};

const base64ToBlob = async (base64: string, contentType = "image/png") => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
};

Deno.serve(async (req) => {
  const start = performance.now();
  const jigsawstack = JigsawStack({
    apiKey: Deno.env.get("JIGSAWSTACK_API_KEY") || "",
  });
  const { photo, mode } = await req.json();
  const prompt = prompts[mode as string] || prompts["calendar"];
  try {
    const blob = await base64ToBlob(photo);
    const key = Date.now().toString() + ".png";
    const blobResult = await jigsawstack.store.upload(blob, {
      filename: key,
      overwrite: true,
    });
    console.log("Blob Data:", blobResult);

    // Use it in the ocr api
    const OCRResult = await jigsawstack.vision.vocr({
      prompt: prompt,
      file_store_key: key,
    });
    const end = performance.now();
    const executionTime = end - start;
    console.log(`Execution time: ${executionTime} ms`);

    const JSONresponse =
      (await JSON.parse(OCRResult.context.slice(8, -3))) || "";
    return new Response(JSON.stringify(JSONresponse), {
      status: 200,
      statusText: "success",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.log("Error in processing image: ", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      statusText: "error",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
});
