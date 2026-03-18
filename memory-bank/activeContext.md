# Active Context

## Current State
The app features a robust UI for parallel reading of locally parsed PDFs. 
The Command Palette (`Cmd+K`) has been completely overhauled to feature a split-pane layout: 
1. The left pane shows fuzzy search results (individual sentences matching the query).
2. The right pane acts as a **"Translator Box"**. Clicking a sentence populates this box, displaying the full original context and triggering a real API call to `dictionaryapi.dev` to fetch structured dictionary meanings for the searched word.

## Recent Changes
- Updated `AGENTS.md` to strictly enforce memory-bank updates.
- Refactored `CommandDialog` inside `App.vue` to adopt a side-by-side split design.
- Implemented real dictionary API lookup in the Translator Box, replacing the mock response. It now fetches and elegantly displays structured JSON data including phonetics, parts of speech, and example sentences.

## Next Logical Steps
- **Model / Translation API:** The right-hand column in the main reader view still needs a real translation engine to process the entire document.