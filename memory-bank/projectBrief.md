# Project Brief

## Overview
A Vue 3 single-page application built with Vite and TypeScript that serves as a **Parallel Translator UI**. The core focus is providing an immersive, side-by-side reading experience for documents.

## Core Features
- **Local PDF Parsing:** Allows users to drag and drop PDF files. The text is extracted completely locally in the browser using `pdfjs-dist`.
- **Immersive Reader Layout:** A side-by-side (parallel) view. The left side shows the original source text, and the right side will display the translated text.
- **Customizable Typography:** Users can adjust font sizes on the fly via a slider. Uses premium serif fonts (Lora, Merriweather) for a book-like feel.
- **Fuzzy Search:** A robust Command Palette (`Cmd+K`) powered by `fuse.js` that splits text into sentences and allows fuzzy searching with highlighted keywords, displaying results in a parallel view.
- **Dark Mode:** Seamless light/dark mode support using `@vueuse/core`.

## Architectural Rules
- Prioritize existing marketplace/npm packages over building from scratch (e.g., `vue3-dropzone`, `fuse.js`, `pdfjs-dist`).
- Rely on `shadcn-vue` for UI components.
- Tailor UI for large desktop screens with wide `max-w-4xl` layouts.