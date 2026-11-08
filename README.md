# CattySpeaking

English A1–A2 practice with Vietnamese, English and Traditional Chinese explanations.

## Learning workflow

- A: attempt before seeing an answer; B: listening with optional captions, translation, word annotations and General American IPA; C: useful phrases; D: listening checks.
- E: one consistent goal with four adjustable support levels. Two checked complete attempts without extra hints offer a reduction. This is a trial design rule, not a ZPD measurement.
- F: transfer task and a conversation of up to five learner turns. The built-in fruit counter tracks orders and totals offline; custom lessons use `/api/conversation`.
- After an answer, three context-appropriate expressions include meaning, IPA and audio. Feedback separates required meaning, grammar and register; it does not score pronunciation.
- Familiar-content practice requires learner confirmation, provides optional time suggestions and recording playback, and does not produce an automatic fluency score.
- Optional foreground time logs show four strands. Time, coins and pet rewards are not measures of learning effectiveness.

## Hosting

Existing GitHub-connected Netlify site. Server-only environment variables: `GEMINI_API_KEY` and optionally `GEMINI_MODEL`. Never put the key in HTML or source control.

`netlify/functions/topic.mjs` creates lessons, `feedback.mjs` checks answer text, and `conversation.mjs` manages custom conversations. Shared model-call helpers are in `netlify/lib/` so they are not deployed as standalone functions.

Saved data remains under `cattyspeaking.v1`. Existing coins, pet inventory, lessons and progress are retained. Recordings are temporary. Custom lessons retain their original explanation language. AI output and IPA must be checked before classroom use.

## Checks

Run `node tests/practice.test.mjs`, `node tests/frontend.test.mjs` and `node tests/api.test.mjs`.

The first suite covers deterministic checks and the offline shop. The second exercises existing data, views, adaptive suggestions, no duplicate rewards and stale requests in a simulated DOM. The third mocks Gemini to test handler contracts; it is not a measurement of real AI accuracy.

Browser QA also covers typed paraphrases, variants with IPA, support offers, a three-turn fruit transaction, language changes and familiar-content practice. Physical microphones and multiple real mobile devices still require testing.
