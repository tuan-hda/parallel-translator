import { ref, computed, type Ref } from "vue";
import { watchDebounced } from "@vueuse/core";
import Fuse from "fuse.js";

export function useSearch(parsedParagraphs: Ref<string[]>) {
  const searchQuery = ref("");
  const selectedSentence = ref<any>(null);
  const isFetchingTranslation = ref(false);
  const dictionaryData = ref<any>(null);
  const translationEnVi = ref<string[] | null>(null);
  const sentenceTranslationEnVi = ref<string | null>(null);

  const sentencesList = computed(() => {
    let globalIndex = 0;
    return parsedParagraphs.value.flatMap((p, pIdx) => {
      // Split on '.', '!', '?' followed by space, or newlines
      return p
        .split(/(?<=[.!?])\s+|\n+/)
        .map((s, sIdx) => {
          const text = s.trim();
          return text.length > 0
            ? {
                id: `${pIdx}-${sIdx}`,
                text: text,
                paragraphIndex: pIdx,
                globalIndex: globalIndex++,
              }
            : null;
        })
        .filter(
          (
            item,
          ): item is { id: string; text: string; paragraphIndex: number; globalIndex: number } =>
            item !== null,
        );
    });
  });

  const fuse = computed(() => {
    return new Fuse(sentencesList.value, {
      keys: ["text"],
      includeMatches: true,
      threshold: 0.3,
      ignoreLocation: true,
    });
  });

  const searchResults = computed(() => {
    if (!searchQuery.value.trim()) return [];
    return fuse.value.search(searchQuery.value.trim()).slice(0, 15);
  });

  watchDebounced(
    searchQuery,
    (newQuery) => {
      if (!newQuery.trim() || searchResults.value.length === 0) {
        selectedSentence.value = null;
        dictionaryData.value = null;
        translationEnVi.value = null;
        sentenceTranslationEnVi.value = null;
        return;
      }
      selectSentence(searchResults.value[0].item);
    },
    { debounce: 500, maxWait: 2000 },
  );

  const selectSentence = async (item: any) => {
    let contextText = item.text;
    if (item.globalIndex !== undefined && sentencesList.value) {
      const idx = item.globalIndex;
      const start = Math.max(0, idx - 1);
      const end = Math.min(sentencesList.value.length - 1, idx + 2);
      contextText = sentencesList.value.slice(start, end + 1).map((s: any) => s.text).join(' ');
    }

    const itemWithContext = { ...item, contextText };
    selectedSentence.value = itemWithContext;
    isFetchingTranslation.value = true;
    dictionaryData.value = null;
    translationEnVi.value = null;
    sentenceTranslationEnVi.value = null;

    try {
      // Get the first word of the search query to look up
      const queryWord = searchQuery.value.trim().split(/\s+/)[0];
      if (!queryWord) {
        throw new Error("No word to search");
      }

      // Try to find the complete word in the original text (e.g. if queryWord is "tragi", find "tragic")
      const escapedQuery = queryWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wordRegex = new RegExp(`\\b\\w*${escapedQuery}\\w*\\b`, "i");
      const match = item.text.match(wordRegex);
      const wordToLookup = match ? match[0] : queryWord;

      // Azure Translator for full sentence via Vercel Serverless Function
      let azurePromise: any = Promise.resolve(null);
      if (contextText) {
        azurePromise = fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: contextText }),
        })
          .then((res) => res.json())
          .catch((err) => {
            console.error("Translation API Error:", err);
            return null;
          });
      }

      const [dictionaryRes, translationRes, azureData] = await Promise.all([
        fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(wordToLookup)}`,
        ),
        fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(wordToLookup)}&langpair=en-US|vi-VN`,
        ),
        azurePromise,
      ]);

      if (
        azureData &&
        Array.isArray(azureData) &&
        azureData[0]?.translations?.[0]?.text
      ) {
        sentenceTranslationEnVi.value = azureData[0].translations[0].text;
      }

      if (dictionaryRes.ok) {
        dictionaryData.value = await dictionaryRes.json();
      } else {
        dictionaryData.value = {
          error: "Word not found in English dictionary.",
        };
      }

      if (translationRes.ok) {
        const transData = await translationRes.json();

        if (transData.matches && transData.matches.length > 0) {
          // Sort by match confidence score descending
          const sortedMatches = transData.matches.sort(
            (a: any, b: any) => b.match - a.match,
          );

          // Extract up to 3 unique, sensible-length translations
          const uniqueTranslations = Array.from(
            new Set(
              sortedMatches.map((m: any) => m.translation.trim().toLowerCase()),
            ),
          )
            .filter((t: any) => t.length > 0 && t.length < 40)
            .slice(0, 3);

          if (uniqueTranslations.length > 0) {
            translationEnVi.value = uniqueTranslations.map(
              (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1),
            );
          } else {
            translationEnVi.value = [transData.responseData.translatedText];
          }
        } else {
          translationEnVi.value = [transData.responseData.translatedText];
        }
      }
    } catch (e) {
      dictionaryData.value = { error: "Failed to fetch translation data." };
    } finally {
      isFetchingTranslation.value = false;
    }
  };

  const resetSearch = () => {
    searchQuery.value = "";
    selectedSentence.value = null;
    dictionaryData.value = null;
    translationEnVi.value = null;
  };

  return {
    searchQuery,
    searchResults,
    selectedSentence,
    isFetchingTranslation,
    dictionaryData,
    translationEnVi,
    sentenceTranslationEnVi,
    selectSentence,
    resetSearch,
  };
}
