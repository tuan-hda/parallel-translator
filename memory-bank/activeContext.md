# Active Context

## Current State
The foundational UI and local document processing features are complete. We have successfully transitioned the app from a generic landing page to a highly specialized, immersive parallel reader.

The PDF parsing logic works by chunking text into paragraphs. The search system dynamically splits these paragraphs further into sentences on the fly to perform `fuse.js` threshold-based fuzzy matches. 

## Recent Changes
- Widened the text reading column significantly (`max-w-4xl` wrapper).
- Introduced Dark Mode using `@vueuse/core`.
- Built the `Cmd+K` fuzzy search dialog that maps sentences side-by-side.
- Updated `AGENTS.md` to establish architectural rules regarding dependency usage (preferring established NPM packages) and documenting the updated tech stack.

## Next Logical Steps
- **Model / Translation API:** The most significant missing piece is the actual translation mechanism. We need to decide how the text will be translated (e.g., streaming chunks to an LLM, using a local model, or calling a third-party translation API) and plug that data into the currently blurred right-hand column placeholders.
- **Navigation:** Connect the fuzzy search results to the main view so clicking a sentence smooth-scrolls the reader to that exact position.