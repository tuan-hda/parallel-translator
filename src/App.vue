<script setup lang="ts">
import { ref } from 'vue'
import { usePdf } from '@/composables/usePdf'
import { useSearch } from '@/composables/useSearch'

import ReaderUpload from '@/components/reader/ReaderUpload.vue'
import ReaderHeader from '@/components/reader/ReaderHeader.vue'
import ReaderView from '@/components/reader/ReaderView.vue'
import SearchTranslatorView from '@/components/reader/SearchTranslatorView.vue'

const { isParsing, parsedParagraphs, fileName, parsePdf, deletePdf, hasStorageError } = usePdf()
const { 
  searchQuery, 
  searchResults, 
  selectedSentence, 
  isFetchingTranslation, 
  dictionaryData, 
  translationEnVi,
  sentenceTranslationEnVi,
  selectSentence,  resetSearch 
} = useSearch(parsedParagraphs)

const fontSize = ref([20])
const activeTab = ref<'search' | 'reader'>('search')

const onFileDropped = (file: File) => {
  parsePdf(file)
  activeTab.value = 'search'
}

const handleDeleteDocument = () => {
  if (confirm('Are you sure you want to close and delete this document from the local session?')) {
    deletePdf()
    resetSearch()
  }
}
</script>

<template>
  <div class="min-h-[100dvh] max-w-[1440px] mx-auto bg-[#FDFBF7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors duration-300 relative flex flex-col">

    <ReaderHeader 
      v-if="parsedParagraphs.length > 0"
      :fileName="fileName"
      v-model:fontSize="fontSize"
      v-model:activeTab="activeTab"
      @delete-document="handleDeleteDocument"
    />

    <ReaderUpload 
      v-if="parsedParagraphs.length === 0"
      :isParsing="isParsing"
      @file-dropped="onFileDropped"
    />

    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div v-if="hasStorageError" class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 text-center text-sm">
        Local storage full. Document parsed but won't be saved for your next session.
      </div>
      
      <SearchTranslatorView
        v-if="activeTab === 'search'"
        v-model:searchQuery="searchQuery"
        :searchResults="searchResults"
        :selectedSentence="selectedSentence"
        :isFetchingTranslation="isFetchingTranslation"
        :dictionaryData="dictionaryData"
        :translationEnVi="translationEnVi"
        :sentenceTranslationEnVi="sentenceTranslationEnVi"
        :fileName="fileName"
        @select-sentence="selectSentence"
      />
      <ReaderView 
        v-else-if="activeTab === 'reader'"
        :parsedParagraphs="parsedParagraphs"
        :fontSize="fontSize[0]"
      />
    </div>
    
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
