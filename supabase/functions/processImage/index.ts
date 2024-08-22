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
  const jigsawstack = JigsawStack({
    apiKey:
      "sk_a758d7ec3235e2401f2a0b3a62f362bfb7cf9a2e1d74353cb372b8f2517769f38e185d100058272918dff862438e4ff62b86af322917332d0f8ec554907e21c4024Z9apPy6X9VzGfu87cc",
  });
  const { photo, mode } = await req.json();
  console.log("🚀 ~ Deno.serve ~ photo:", photo);
  const prompt = prompts[mode as string] || prompts["calendar"];

  const blob = await base64ToBlob(photo);
  const key = "test.png";
  const endpoint = `https://api.jigsawstack.com/v1/store/file?key=${key}&overwrite=true`;
  const options = {
    method: "POST",
    headers: {
      "x-api-key":
        "sk_a758d7ec3235e2401f2a0b3a62f362bfb7cf9a2e1d74353cb372b8f2517769f38e185d100058272918dff862438e4ff62b86af322917332d0f8ec554907e21c4024Z9apPy6X9VzGfu87cc",
    },
    body: blob,
  };
  const result = await fetch(endpoint, options);
  const data = await result.json();
  console.log("🚀 ~ takeTheDamnPicture ~ data:", data);
  //use it in the ocr api

  const OCRResult = await jigsawstack.vision.vocr({
    prompt: prompt,
    file_store_key: key,
  });
  // const binaryData = atob(photo);
  // const blob = new Blob([binaryData], { type: "image/png" });
  // const key = "test.png";

  // const blobResult = await jigsawstack.store.upload(blob, {
  //   filename: key,
  //   overwrite: true,
  // });
  // console.log("🚀 ~ Deno.serve ~ blobResult:", blobResult);
  // //use it in the ocr api

  // console.log("🚀 ~ Deno.serve ~ mode:", mode);
  // try {
  //   const eventData = await jigsawstack.vision.vocr({
  //     prompt,
  //     file_store_key: key,
  //   });
  //   console.log("🚀 ~ Deno.serve ~ eventData:", eventData);
  return new Response(JSON.stringify(OCRResult), {
    status: 200,
    statusText: "success",
    headers: {
      "Content-Type": "application/json",
    },
  });
  // } catch (error) {
  //   console.log("error: ", error);
  //   return new Response(JSON.stringify(error), {
  //     status: 500,
  //     statusText: "error",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   });
  // }
  // const OCRResult = await jigsawstack.vision.vocr({
  //   prompt,
  //   url: photo,
  // });
  // console.log("🚀 ~ Deno.serve ~ OCRResult:", OCRResult);
  // return new Response(JSON.stringify(OCRResult), {
  //   status: 200,
  //   statusText: "success",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });
});
