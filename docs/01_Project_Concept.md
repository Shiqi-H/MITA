# MITA — Multimodal Interactive Botanical Garden
## Short Description of the Project Concept

**Course:** Multimodal Interactive Technologies and Applications

### 1. Vision

MITA (Multimodal Interactive Tour Assistant) is a browser-based, immersive
botanical garden that combines **WebVR panoramic exploration** with a
**conversational, voice-driven assistant**. The user walks through a sequence
of 360° panoramic scenes, points at plants in 3D, and *talks* to the system in
natural language to learn about each specimen. The goal is to turn a
traditional botanical exhibit — where information is delivered through static
labels — into a fluid, multimodal dialogue between user, environment and
content.

### 2. Characterizing Features

- **Immersive 3D environment.** The garden is built on top of **A-Frame
  (WebVR)** and rendered directly in the browser. Five panoramic scenes
  (`scene-1` … `scene-5`) are connected through clickable arrow portals, and
  individual plant specimens (`Lavandula`, `Nephrolepis`, `Santolina`,
  `Opuntia`, …) are loaded as positioned `glTF` models that the user can
  approach and inspect from any angle.

- **Multimodal input.** Three input channels are tightly integrated:
  1. **Gaze / pointer raycasting** to select a plant in 3D space.
  2. **Speech (STT)** through the browser-native Web Speech API for
     hands-free, natural-language queries (e.g. *“What is this plant used
     for?”*, *“Compare it with the lavender.”*).
  3. **Click / touch fallback** for accessibility and noisy environments
     (e.g. the on-screen A / B disambiguation buttons).

- **Multimodal output.** Responses are delivered through a coordinated
  combination of:
  - **Spatial highlight** on the selected 3D plant (glow / outline).
  - **Adaptive 2D information cards** (botanical, medicinal, comparison,
    fallback) rendered as a HUD overlay.
  - **Text-to-Speech (TTS)** narration so that the user does not need to
    leave the VR view to read.

- **LLM-driven dialogue manager.** A Node.js / Express + WebSocket backend
  routes every user turn through an LLM (`server/services/llm.js`) that
  performs **intent parsing** (`query_info`, `query_attribute`, `compare`)
  and **slot extraction** (`medicinal`, `botanical`, `toxicity`, `drought`,
  `feng_shui`). This lets the same utterance — *“is it poisonous?”* — be
  interpreted against the currently selected plant, the conversation
  history, and the structured plant database (`server/data/plants.json`).

- **State-machine interaction model.** Each WebSocket exchange is governed
  by a finite set of message types (`query`, `clarify`, `disambiguate`,
  `response`, `comparison`, `fallback`, `clarify_retry`, `error`). A
  per-client `session` tracks visited plants, pending disambiguations and
  dialogue history, allowing the assistant to reason contextually across
  turns.

- **Robust disambiguation strategy.** When the raycaster returns several
  overlapping plants, candidates are ranked by depth (z-axis), labelled
  *A / B / C* and announced verbally. The user can resolve the ambiguity
  by **voice** (*“the one in front”*, *“A”*) or by **clicking** the on-screen
  overlay. Up to two clarification retries are tolerated before the system
  falls back to pure pointer selection.

### 3. Target User and Use Case

The system is designed for **casual museum visitors, students of botany
and accessibility-oriented users** who want to explore a botanical
collection from a desktop, tablet or VR headset. The conversational layer
lowers the barrier to specialised botanical knowledge: instead of reading
long labels, users can ask focused questions (*“Can I keep this around my
cat?”*, *“How does it compare to the cactus?”*) and receive concise,
spoken answers paired with a visual card.

### 4. Why It Is Multimodal

MITA is multimodal **by design, not by accident**: every interaction loop
fuses at least two input modalities (point + speak) and three output
modalities (3D highlight + visual card + voice). The system also degrades
gracefully — if speech recognition fails, the user can click; if the LLM
is uncertain, a structured A/B overlay takes over; if a requested slot is
missing in the database, a *fallback card* proposes alternative topics.
This redundancy between channels is what allows the experience to remain
fluent across users, devices and ambient conditions.
