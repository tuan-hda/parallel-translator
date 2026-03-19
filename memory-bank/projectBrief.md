# Project Brief

## Overview
A Vue 3 single-page application built with Vite and TypeScript that serves as a **Parallel Translator UI**. The core focus is providing an immersive, side-by-side reading experience for documents with persistent local sessions.

## Core Features
- **Local PDF Parsing:** Allows users to drag and drop PDF files (up to 5MB). The text is extracted completely locally in the browser using `pdfjs-dist`.
- **Persistent Local Sessions:** Parsed document data is automatically saved to `localStorage`, allowing users to resume their reading session even after closing the browser.
- **Tabbed Reader Layout:** 
  - **Search & Translate:** A persistent, split-pane view for fuzzy searching and dictionary lookups.
  - **Document View:** A side-by-side (parallel) view for reading the full extracted text.
- **Customizable Typography:** Users can adjust font sizes on the fly via a slider. Uses premium serif fonts (Lora, Merriweather) for a book-like feel.
- **Debounced Fuzzy Search:** A robust search system powered by `fuse.js` that automatically fetches dictionary definitions from `dictionaryapi.dev` as the user types (with a 500ms debounce).
- **Session Management:** Users can "Close Document" to clear the current session and wipe all data from local storage.
- **Dark Mode:** Seamless light/dark mode support using `@vueuse/core`.

## Architectural Rules
- Prioritize existing marketplace/npm packages over building from scratch (e.g., `vue3-dropzone`, `fuse.js`, `pdfjs-dist`).
- Rely on `shadcn-vue` for UI components.
- Tailor UI for large desktop screens with wide `max-w-[1440px]` layouts.
- Keep all processing and storage strictly local to the user's device.
