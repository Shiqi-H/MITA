# MITA Botanical Garden

English | [中文](README-zh_cn.md)

[![Vite](https://img.shields.io/badge/Vite-8.0.10-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![A-Frame](https://img.shields.io/badge/A--Frame-1.5.0-EF2D5E?logo=aframe&logoColor=white)](https://aframe.io/)
[![Three.js](https://img.shields.io/badge/Three.js-0.158.0-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![Photo Sphere Viewer](https://img.shields.io/badge/Photo%20Sphere%20Viewer-5.14.1-2F80ED)](https://photo-sphere-viewer.js.org/)
[![GSAP](https://img.shields.io/badge/GSAP-3.15.0-88CE02?logo=greensock&logoColor=white)](https://gsap.com/)
[![Node.js](https://img.shields.io/badge/Node.js-backend-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

Botanical Garden is an interactive web demo designed for exploring plant scenes. The frontend uses Vite and A-Frame/Three.js to present 360-degree panoramic scenes, 3D plant models, and interactive panels. The backend provides functions such as intent parsing, plant information generation, ambiguity clarification, and plant comparison.

## How to Run

The project requires the necessary dependencies to be installed locally first. In the project root directory, run:

```powershell
npm install
```

Then start the frontend and backend in two separate processes.

### 1. Start the Frontend

In the project root directory, run:

```powershell
npm.cmd run dev
```

### 2. Start the Backend

Open another terminal and run the following command in the project root directory:

```powershell
npm.cmd run server
```

This command executes the `server` script defined in the root `package.json` file and starts the backend from the `server` directory.

> In PowerShell, it is recommended to use `npm.cmd`. If your environment supports it, you can also use `npm run dev` and `npm run server`.

After both processes are running, open the local development URL printed in the frontend terminal in a web browser. It is usually:

```text
http://localhost:5173/
```

If the terminal shows a different port, open the URL shown in the terminal instead.

## Course Task Design

### Task 1: Visual Detection and Multimodal Disambiguation

- Users can ask questions such as `what is this` or `what plant am I looking at`.
- When there are multiple candidate plants in the current view or current scene, the system enters the referential ambiguity flow.
- The system generates A/B/C labels for the candidate plants. Users can click a candidate, type a letter, or answer with a letter by voice.
- If speech recognition fails or the answer cannot be matched, the system prompts the user to choose again and, after repeated failures, guides the user to directly click the target plant.

### Task 2: Plant Selection and In-depth Dialogue

- The system supports queries about plant properties, such as medicinal value and basic botanical information.
- When the user asks about medicinal value, medical use, or herbal use, the system opens a dedicated medicinal information panel.
- If the user asks about an unsupported topic, such as toxicity, the system displays a fallback interaction and guides the user to supported topics, such as botanical features or medicinal value.
- Information generation first attempts to use the backend LLM interface. If it fails, the system keeps a local fallback to prevent the core interaction from breaking completely.

### Task 3: Cross-context Plant Comparison

- The system supports comparing the currently selected plant with another plant, for example:

```text
Is this more drought tolerant than the ficus?
```

- The comparison panel displays the descriptions and key attributes of both plants, including drought tolerance, height, lifespan, and medicinal value.
- The comparison target is first searched from the user's visit history. If it is not found in the history, the system falls back to the global plant database.
- The backend `/api/compare` endpoint is responsible for generating the natural-language comparison answer, while the frontend is responsible for displaying the structured comparison result.

## Completed

- [x] Historical comparison: The system supports questions such as “Which is more drought tolerant, this selected plant or the previously selected plant?” (**Note: currently, only drought tolerance comparison is supported**). The system uses `visitedPlantIds` to find the previously selected plant and compare it automatically.
- [x] Multi-turn follow-up dialogue: Users can first select a plant and then ask questions such as “What is its medicinal value?” (**Note: currently, only medicinal-value questions are supported**) or “How does it compare with the previous one?”. The system automatically maintains the context.
- [x] Offline mode: When no LLM is available, the system can use local rules and templates to generate responses.
- [x] When switching or creating scenes, resources from the previous scene, such as DOM elements, are cleared.
- [x] After voice input, the recognized text is first displayed in the input box. The user can confirm it before sending it to the system, giving the user a chance to modify the input.
- [x] Unified card styles and optimized layout.
- [x] Ambiguous plant count parsing: The frontend and backend remain consistent. The parsing logic is dynamically adjusted according to the number of plants in the current view, supporting more plant options.

## To Do

- [ ] Improve the database: provide a model for each plant, add images, and enrich the related information.
- [ ] Add more plants and optimize the placement of plant models.
- [x] After a plant is deselected by closing the plant information card, the highlight state is also removed. Previously, the plant still appeared as selected.
- [ ] Support comparison of more attributes.
- [ ] Support spatial expressions in ambiguity resolution, such as “the one in front”. Currently, plant candidates are not sorted by front/back depth. The identification flow uses visible plants or the current scene plant list, and `visiblePlants` is sorted by screen X coordinate rather than by depth or front/back position.
- [ ] The fallback guidance after multiple recognition failures is only weakly implemented. It only changes the placeholder text; clickable candidate buttons are already displayed from the beginning, and no more obvious fallback UI is added.
- [ ] When ambiguity candidates exist, even normal user questions may be treated as ambiguity responses. The intent parsing logic needs to be improved so that ambiguity replies are triggered only when the user clearly expresses a disambiguation choice.
- [ ] During disambiguation, the system cannot recognize input such as “Choose A”; it can only recognize “A”. The intent parsing logic needs to be improved to support more selection commands.
- [ ] If the system cannot recognize the user's voice input, it should give clear feedback. A new response type, such as `"unrecognized_input"`, could be added so that this type of response is returned when the user's input cannot be recognized.
