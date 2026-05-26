# MITA — Main Tasks for Heuristic Evaluation

**Course:** Multimodal Interactive Technologies and Applications

This document describes the three main interaction tasks on which the
evaluating team is expected to run their heuristic evaluation. Each task
specifies the user goal, the modalities involved, the expected
interaction flow, and the success criteria. All tasks take place inside
the immersive A-Frame botanical garden after the loading screen has
dismissed and the first panoramic scene (`scene-1`) is visible.

---

## Task 1 — Disambiguation of Overlapping Plants

### User Goal
The user wants to ask a question about **one specific plant** in a region
of the scene where several specimens visually overlap (e.g. the cluster
of Lavandula / Nephrolepis / Santolina near the right path in
`scene-1`).

### Modalities Involved
- **Input:** pointer raycasting (gaze / mouse / touch) **+** speech (STT)
  **+** click fallback on the on-screen A / B overlay.
- **Output:** 3D highlight on every candidate plant, modal overlay with
  labelled options, and a TTS clarification question.

### Expected Interaction Flow
1. The user points at the overlapping plants and clicks (or speaks while
   gazing).
2. The frontend collects all raycaster intersections of class
   `.plant-model`, attaches their 3D positions, and sends a `query`
   WebSocket message to the backend.
3. The server detects `hits.length > 1`, sorts candidates by depth
   (`z` ascending → *in front*), and returns a `disambiguate` payload
   containing labelled candidates (`A`, `B`, …) together with a generated
   spoken question (*“I can see two plants — do you mean A, the one in
   front, or B, behind it?”*).
4. The client highlights every candidate, opens the A / B overlay, and
   plays the TTS prompt.
5. The user resolves the ambiguity either by **speaking** (*“A”*,
   *“the one behind”*, *“lavender”*) or by **clicking** the overlay
   button. The client sends a `clarify` message.
6. The server matches the utterance against the pending candidates
   stored in the session and returns a regular `response`, which renders
   the corresponding information card and dismisses the overlay.

### Success Criteria
- The highlight, the overlay and the TTS prompt appear within roughly
  one second of the click.
- Voice resolution succeeds for natural phrasings such as *“A”*, *“the
  front one”*, or the plant’s name.
- If the LLM cannot resolve the utterance, a `clarify_retry` is issued
  with a softer reformulation; after **two** failed retries the user is
  explicitly guided to use the click buttons.
- No information card is rendered until the ambiguity is resolved.

### Suggested Heuristics
Match between system and the real world; visibility of system status;
user control and freedom (the overlay is always dismissible); error
prevention and recovery (retry + click fallback).

---

## Task 2 — Comparing the Current Plant with a Recently Visited One

### User Goal
After inspecting at least one plant, the user wants to **compare** a
newly selected plant with a plant seen earlier (e.g. *“How does this one
compare to the lavender I just looked at?”*).

### Modalities Involved
- **Input:** pointer raycasting to lock onto the new plant **+** speech
  (free-form natural-language comparison query).
- **Output:** a dedicated **comparison card** rendered side-by-side, plus
  a TTS summary of the differences.

### Expected Interaction Flow
1. The user has previously selected at least one plant; its id and name
   are stored in the client-side `visitedPlants` list and synchronised
   with the server session at every turn.
2. The user clicks the second plant and asks a comparison-flavoured
   question (*“compare it with the lavender”*, *“which one is more
   drought-tolerant?”*).
3. The frontend sends a `query` message containing `hits`, `text` and
   the full `visited` history.
4. The server runs `parseIntent` on the utterance. If the intent is
   `compare` and a `comparison_target` is identified (by id, alias or
   recency), the request is delegated to `compareHandler.js`.
5. The handler fetches both plants from `plants.json`, optionally filters
   by the detected `interest_slot` (e.g. `medicinal`, `drought`), and
   returns a `comparison` payload with both records and a spoken summary.
6. The client renders `renderComparisonCard(plant1, plant2, slot)` and
   plays the TTS narration.

### Success Criteria
- The system correctly resolves implicit references such as *“the
  previous one”* or *“lavender”* using the visited list and the plant
  alias table.
- The comparison card visually aligns matching attributes (height,
  toxicity, drought tolerance, family…) between the two plants.
- Comparison only triggers when the user is **not locked** to a single
  plant via the contextual follow-up path, which prevents accidental
  comparisons during a focused Q&A session.
- A graceful error is returned when no valid second plant can be
  identified.

### Suggested Heuristics
Recognition rather than recall (visited plants are remembered for the
user); consistency and standards (same card layout as Task 3); aesthetic
and minimalist design (only the requested slot is compared, not the full
record).

---

## Task 3 — Dynamic Information Card Driven by Spoken Intent

### User Goal
The user wants **targeted information** about a single plant — botanical
description, medicinal use, toxicity, drought tolerance, feng-shui
symbolism — without having to navigate menus.

### Modalities Involved
- **Input:** pointer raycasting to select the plant **+** speech (STT)
  for the natural-language question; optional follow-up turns are sent
  with `lockToSelected: true` so the system stays focused on the
  currently displayed plant.
- **Output:** a context-sensitive information card whose layout depends
  on the detected `interest_slot` (`medical`, `botanical`, default), the
  3D highlight of the selected plant, and a TTS answer.

### Expected Interaction Flow
1. The user selects a plant; the server records the visit and the LLM
   parses the intent and slot of the utterance.
2. The slot is mapped to a card type via the `SLOT_TO_CARD` table
   (`medicinal → medical`, `botanical → botanical`, others → `default`).
3. If the requested slot is not available in the database (e.g.
   `feng_shui` for a plant with `feng_shui_info: null`), the server
   returns a `fallback` payload listing the **slots that do exist** for
   that plant, together with a polite spoken explanation.
4. The client renders the appropriate card:
   - `renderInfoCard(cardType, data, onFollowUp)` for normal answers.
   - `renderFallbackCard(msg, onSlotPicked)` for missing data, where
     each button re-issues a `query` locked to the same plant.
5. Subsequent user utterances are treated as **contextual follow-ups**
   on the same plant; `generateContextualAnswer` reuses the dialogue
   history to produce coherent multi-turn answers.

### Success Criteria
- The card type changes according to the spoken intent: e.g. asking
  *“is it safe for my dog?”* surfaces toxicity content rather than the
  default description.
- The fallback path never leaves the user at a dead end: at least one
  alternative slot is always offered when data is missing.
- Multi-turn follow-ups remain locked to the selected plant; switching
  to another plant explicitly clears the dialogue panel
  (`clearDialogue()` is called when `selectedPlantId` changes).
- TTS, card and 3D highlight remain synchronised across turns.

### Suggested Heuristics
Flexibility and efficiency of use (shortcut from natural language to
deep content); help users recognise and recover from errors (fallback
slots); consistency between voice and visual answers; minimalist design
of each card.

---

## Out-of-Scope Tasks

The following capabilities are part of the system but are **not** the
focus of this heuristic evaluation:

- **Scene navigation** between the five panoramic environments via arrow
  portals — evaluated only as a pre-condition for reaching the plants.
- **STT/TTS audio quality** itself — assumed to inherit the quality of
  the browser-native Web Speech API.
- **LLM answer factuality** — content correctness is bounded by the
  curated `plants.json` database and is not a target of the UX
  evaluation.
