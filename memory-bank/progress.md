# Progress

## What works
- **Project Setup:** Vue 3, Vite, TypeScript, Tailwind CSS v4.
- **UI Framework:** Integrated `shadcn-vue` and custom components.
- **Persistent Storage:** Fully functional local storage caching for document data (up to 5MB) using `localStorage`.
- **PDF Upload & Parsing:** A drag-and-drop area with a 5MB size limit that extracts text locally and caches it immediately for future sessions.
- **Tabbed Layout System:** A dedicated `Search & Translate` tab and a `Document View` tab, allowing for distinct workflows within the same app.
- **Search & Dictionary System:** 
  - **Debounced Auto-Fetch:** Typing in the search bar triggers a 500ms debounce that automatically selects the first result and fetches its meaning from `dictionaryapi.dev`.
  - **Split-Pane Search View:** A larger, taller persistent view where search results on the left are paired with context and translation data on the right.
- **Session Management:** A "Close Document" feature that clears the session and wipes the document from local storage.
- **Reading Experience:** 
  - Integrated `@tailwindcss/typography` with Lora/Merriweather serif fonts.
  - Reactive draggable font-size slider.
  - Light/Dark mode toggling via `@vueuse/core`.

## What is left to build
- **Full Document Translation:** The "Document View" still needs a way to fetch and display the translation for all extracted paragraphs side-by-side.
- **Jump to Context:** Integrating the "Search & Translate" view with the "Document View" so that selecting a result can optionally take the user to its exact position in the document.
- **Search Navigation Improvements:** Improving dictionary lookups to handle cases where multiple words in a search query might need independent translation/lookup.
