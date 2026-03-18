# Progress

## What works
- **Project Setup:** Vue 3, Vite, TypeScript, Tailwind CSS v4.
- **UI Framework:** Integrated `shadcn-vue` components (Card, Button, Input, Label, Slider, Dialog, Command).
- **PDF Upload & Parsing:** Fully functional drag-and-drop area (`vue3-dropzone`) that extracts text locally using `pdfjs-dist` and splits it into manageable paragraphs.
- **Reader Layout:** A wide, side-by-side split screen (`max-w-[1440px]`) tailored for large screens, automatically falling back to a stacked layout on mobile.
- **Reading Experience:** 
  - Integrated `@tailwindcss/typography` with Lora/Merriweather serif fonts.
  - Added a reactive draggable font-size slider.
  - Implemented Light/Dark mode toggling.
- **Search System:** A `Cmd+K` command palette utilizing `fuse.js`. Paragraphs are dynamically chunked into sentences for granular fuzzy searching. 
  - **Translator Box UI:** When a search result is selected, it populates a right-side pane with the original sentence context. It extracts the first word of the search query and fetches its real meaning from `dictionaryapi.dev`, displaying a structured layout of phonetics and parts of speech.

## What is left to build
- **Real Translation Integration:** The Translation column in the main reader currently renders mock/placeholder responses. The actual translation mechanism (via an LLM or external API) needs to be integrated for the full document.
- **Search Action (Main View):** Hooking up the search results to jump the main reader view to the specific paragraph if needed.