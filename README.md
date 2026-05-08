# MITA - Multimodal Botanical Garden

MITA is a browser-based 3D botanical garden prototype built with Vite, A-Frame, and native JavaScript modules. It demonstrates three grounding-loop interactions in English:

- region selection with ambiguity repair
- persistent visited targets for comparison
- interest-slot filling for medicinal information

## Tech Stack

- Vite
- Native JavaScript ES modules
- A-Frame / Three.js
- Web Speech API for STT/TTS
- JSON data files for plants, scenes, and intent keywords
- Optional Express intent API stub in `server/`

## Project Structure

```text
src/
  main.js
  style.css
  data/
    plants.json
    scenes.json
    intents.json
  core/
    grounding.js
    intentParser.js
    llmClient.js
    plantRenderer.js
    sceneRenderer.js
    selectors.js
    speech.js
    state.js
  ui/
    comparePanel.js
    dom.js
    fallbackPanel.js
    medicalPanel.js
    panels.js
```

## Run

```bash
npm install
npm.cmd run dev
```

Use `npm.cmd` on Windows PowerShell if script execution policy blocks `npm`.

## Build

```bash
npm.cmd run build
```

## Demo Prompts

- `What is this?`
- `A`
- `B`
- `front one`
- `back one`
- `Is it more drought tolerant than the giant water lily?`
- `Tell me about its medicinal value.`

## Optional Intent API

The frontend defaults to local rule parsing. To route intent parsing to a backend, set:

```text
VITE_INTENT_ENGINE=llm
```

The optional backend stub is in `server/`:

```bash
cd server
npm install
npm run dev
```

The API shape is:

```http
POST /api/parse-intent
Content-Type: application/json
```

The stub is deterministic and can be replaced with a model API call later. Do not place API keys in frontend code.
