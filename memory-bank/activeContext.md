# Active Context

## Current State
The app features a robust UI for parallel reading of locally parsed PDFs. 
The Command Palette (`Cmd+K`) has been completely overhauled to feature a split-pane layout: 
1. The left pane shows fuzzy search results (individual sentences matching the query).
2. The right pane acts as a **"Translator Box"**. Clicking a sentence populates this box, displaying the full original context and triggering a mock API call to simulate fetching a translation.

## Recent Changes
- Updated `AGENTS.md` to strictly enforce memory-bank updates.
- Refactored `CommandDialog` inside `App.vue` to adopt a side-by-side split design.
- Implemented a mock API response lifecycle (with loading skeleton states) for the Translator Box when a user selects a search result.

## Next Logical Steps
- **Model / Translation API:** Replace the mock `setTimeout` API response inside `selectSentence` with a real backend/API call to translate the text. Apply this same real translation engine to populate the right-hand column in the main reader view.