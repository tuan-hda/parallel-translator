<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { usePdf } from '@/composables/usePdf'
import { useSearch } from '@/composables/useSearch'

import ReaderUpload from '@/components/reader/ReaderUpload.vue'
import ReaderHeader from '@/components/reader/ReaderHeader.vue'
import ReaderView from '@/components/reader/ReaderView.vue'
import SearchTranslatorDialog from '@/components/reader/SearchTranslatorDialog.vue'

const { isParsing, parsedParagraphs, fileName, parsePdf } = usePdf()
const { 
  searchQuery, 
  searchResults, 
  selectedSentence, 
  isFetchingTranslation, 
  dictionaryData, 
  selectSentence,  resetSearch 
} = useSearch(parsedParagraphs)

const fontSize = ref([20])
const isSearchOpen = ref(false)

const toggleSearch = () => { 
  isSearchOpen.value = !isSearchOpen.value 
}

watch(isSearchOpen, (isOpen) => {
  if (!isOpen) {
    resetSearch()
  }
})

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    toggleSearch()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const onFileDropped = (file: File) => {
  parsePdf(file)
}
</script>

<template>
  <div class="min-h-[100dvh] max-w-[1440px] mx-auto bg-[#FDFBF7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors duration-300 relative">
    
    <SearchTranslatorDialog 
      v-model:open="isSearchOpen"
      v-model:searchQuery="searchQuery"
      :searchResults="searchResults"
      :selectedSentence="selectedSentence"
      :isFetchingTranslation="isFetchingTranslation"
      :dictionaryData="dictionaryData"
      @select-sentence="selectSentence"
    />

    <ReaderHeader 
      v-if="parsedParagraphs.length > 0"
      :fileName="fileName"
      v-model:fontSize="fontSize"
      @toggle-search="toggleSearch"
    />

    <ReaderUpload 
      v-if="parsedParagraphs.length === 0"
      :isParsing="isParsing"
      @file-dropped="onFileDropped"
    />

    <ReaderView 
      v-else
      :parsedParagraphs="parsedParagraphs"
      :fontSize="fontSize[0]"
    />
    
  </div>
</template>

<style>
/* Smooth scrollbar for the reading columns */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
