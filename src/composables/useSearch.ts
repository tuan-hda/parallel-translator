import { ref, computed, type Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import Fuse from 'fuse.js'

export function useSearch(parsedParagraphs: Ref<string[]>) {
  const searchQuery = ref('')
  const selectedSentence = ref<any>(null)
  const isFetchingTranslation = ref(false)
  const dictionaryData = ref<any>(null)

  const sentencesList = computed(() => {
    return parsedParagraphs.value.flatMap((p, pIdx) => {
      // Split on '.', '!', '?' followed by space, or newlines
      return p.split(/(?<=[.!?])\s+|\n+/).map((s, sIdx) => {
        const text = s.trim()
        return text.length > 0 ? {
          id: `${pIdx}-${sIdx}`,
          text: text,
          paragraphIndex: pIdx
        } : null
      }).filter((item): item is { id: string; text: string; paragraphIndex: number } => item !== null)
    })
  })

  const fuse = computed(() => {
    return new Fuse(sentencesList.value, {
      keys: ['text'],
      includeMatches: true,
      threshold: 0.3,
      ignoreLocation: true
    })
  })

  const searchResults = computed(() => {
    if (!searchQuery.value.trim()) return []
    return fuse.value.search(searchQuery.value.trim()).slice(0, 15)
  })

  watchDebounced(
    searchQuery,
    (newQuery) => {
      if (!newQuery.trim() || searchResults.value.length === 0) {
        selectedSentence.value = null
        dictionaryData.value = null
        return
      }
      selectSentence(searchResults.value[0].item)
    },
    { debounce: 500, maxWait: 2000 }
  )

  const selectSentence = async (item: any) => {
    selectedSentence.value = item
    isFetchingTranslation.value = true
    dictionaryData.value = null
    
    try {
      // Get the first word of the search query to look up
      const wordToLookup = searchQuery.value.trim().split(/\s+/)[0]
      if (!wordToLookup) {
        throw new Error('No word to search')
      }
      
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(wordToLookup)}`)
      if (!res.ok) {
        dictionaryData.value = { error: 'Word not found in dictionary.' }
      } else {
        const data = await res.json()
        dictionaryData.value = data
      }
    } catch (e) {
      dictionaryData.value = { error: 'Failed to fetch dictionary data.' }
    } finally {
      isFetchingTranslation.value = false
    }
  }

  const resetSearch = () => {
    searchQuery.value = ''
    selectedSentence.value = null
    dictionaryData.value = null
  }

  return {
    searchQuery,
    searchResults,
    selectedSentence,
    isFetchingTranslation,
    dictionaryData,
    selectSentence,
    resetSearch
  }
}