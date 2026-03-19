# Active Context

## Current State
The app has moved away from a modal-based search to a persistent, tabbed interface for reading and searching documents.
1. **Search & Translate Tab (Default):** A full-screen split-pane layout. The left side handles fuzzy search, and the right side displays the context and dictionary lookup results. This view is automatically focused after a PDF is uploaded.
2. **Document View Tab:** Houses the traditional side-by-side paragraph reader, allowing the user to read through the document's extracted text.

The app now utilizes **`localStorage`** to persist the parsed PDF paragraphs and filename across sessions, allowing the user to resume their work immediately.

## Recent Changes
- **Revamped Layout:** Replaced `SearchTranslatorDialog` with a dedicated `SearchTranslatorView` component. 
- **Tabbed Navigation:** Implemented a tab switcher in the `ReaderHeader` for toggling between the search view and the document reader.
- **Persistence:** Added local storage logic to `usePdf.ts` to cache document data (with a 5MB limit).
- **Auto-Fetch Search:** Integrated `watchDebounced` in `useSearch.ts` to automatically select the first search result and fetch the dictionary API after 500ms of inactivity in the search bar.
- **Session Management:** Added a "Close / Delete Document" button that wipes local storage and resets the application state.
- **Improved Type Safety:** Fixed `vue-tsc` errors related to dynamic array indices in templates.

## Next Logical Steps
- **Jump to Context:** Adding a "View in Document" button within the search results that automatically switches to the "Document View" tab and scrolls to the selected paragraph.
- **Full-Document Translation:** The document reader view still needs a real translation engine (e.g., integrating an LLM) to process the entire document side-by-side.
