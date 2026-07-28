# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

WriteMyCalendar turns a photo of a handwritten daily schedule notecard into real calendar events (or a text note). Flow: open the app → sign in with Google or Apple → photograph a notecard in the camera view → the photo is sent to a backend function that asks OpenAI's vision model to transcribe it into structured JSON → the app writes that JSON to the user's Google Calendar (or Google Docs, in "text" mode).

## Commands

- `npm start` — start the Expo dev server (Metro)
- `npm run ios` / `npm run android` / `npm run web` — run on a platform via `expo run:*` / `expo start --web`
- `npm test` — run Jest in watch mode (`jest-expo` preset)
  - single file: `npx jest components/__tests__/ThemedText-test.tsx`
  - single test by name: `npx jest -t "test name"`
- `npm run lint` — `expo lint`
- `npm run edge` — deploy the Supabase edge function (`supabase functions deploy`)

## Architecture

**Routing**: Expo Router, file-based, under `app/`. `app/_layout.tsx` wraps everything in `ModeProvider` and a navigation `ThemeProvider`; `app/(tabs)/` holds the tab screens. `app/(tabs)/index.tsx` is where the actual camera → parse → write flow lives (`takeTheDamnPicture`).

**Mode context**: `components/context/modeContext.tsx` is a small reducer (`CHANGE_MODE`) persisted to `AsyncStorage` under the key `"mode"`. Mode is either `"calendar"` or `"text"` and determines both which OpenAI prompt is used server-side and which write path (`addEventsToCalendar` vs `addTextToDocument`) runs client-side after parsing.

**Auth**: two independent, parallel flows rather than a unified auth abstraction — Google (`@react-native-google-signin/google-signin`, via `components/GoogleSignInButton.tsx`) and Apple (`expo-apple-authentication`, via `components/AppleSignInButton.tsx`). Whichever succeeds last wins: it writes `authMethod` (`"google"` | `"apple"`) plus a token (`googleToken`/`appleToken`) and `userEmail` to `AsyncStorage`. `utils/authUtils.ts#getAuthMethod()` reads `authMethod` back and confirms the matching token is still present. The Apple side only sets up the token — actual Calendar/Notes writes for Apple are unimplemented stubs in `app/(tabs)/index.tsx` (`addEventsToCalendar`/`addTextToDocument`), only the Google paths are wired up (Calendar API, Drive API for notes).

**Image processing backend**: `supabase/functions/processImage/index.ts` is a Deno-based Supabase Edge Function — the live backend the app calls (URL is hardcoded in `app/(tabs)/index.tsx`, not env-driven; pointing at a different Supabase project means editing that fetch call directly). It picks a prompt keyed by `${authMethod}${Mode}` (e.g. `googleCalendar`, `appleNotes`) from a `prompts` map, sends the notecard photo + prompt to OpenAI `gpt-4o`, and returns the parsed JSON. Requires `OPENAI_API_KEY` set as a secret on the Supabase project (not present locally).

**Env vars**: `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` are injected per build profile in `eas.json` rather than a local `.env`.

**Path alias**: `@/*` maps to the repo root (`tsconfig.json`), e.g. `@/utils/authUtils`, `@/components/...`.
