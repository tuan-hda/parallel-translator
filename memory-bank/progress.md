# Progress

## What works
- **Project Setup:** Vue 3, Vite, TypeScript, Tailwind CSS v4.
- **UI Framework:** Integrated `shadcn-vue` components (Card, Button, Input, Label, Slider, Dialog, Command).
- **PDF Upload & Parsing:** Fully functional drag-and-drop area (`vue3-dropzone`) that extracts text locally using `pdfjs-dist` and splits it into manageable paragraphs.
- **Reader Layout:** A wide, side-by-side split screen (`max-w-4xl`) tailored for large screens, automatically falling back to a stacked layout on mobile.
- **Reading Experience:** 
  - Integrated `@tailwindcss/typography` with Lora/Merriweather serif fonts.
  - Added a reactive draggable font-size slider.
  - Implemented Light/Dark mode toggling.
- **Search System:** A `Cmd+K` command palette utilizing `fuse.js`. Paragraphs are dynamically chunked into sentences for granular fuzzy searching. Results display side-by-side (Original vs. Placeholder Translation) with keyword highlighting.

## What is left to build
- **Translation Integration:** The "Translation" column currently renders a blurred placeholder ("Awaiting Model"). The core translation logic (presumably via an LLM or external API) needs to be integrated to populate the right column dynamically.
- **Search Action:** Hooking up the click action on search results to scroll/jump the main reader view to the specific paragraph.