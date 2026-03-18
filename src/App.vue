<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDropzone } from 'vue3-dropzone'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { UploadCloud, FileText, Type, Search, Moon, Sun } from 'lucide-vue-next'
import { Slider } from '@/components/ui/slider'
import { useDark, useToggle } from '@vueuse/core'
import Fuse from 'fuse.js'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const isDark = useDark()
const toggleDark = useToggle(isDark)

const isParsing = ref(false)
const parsedParagraphs = ref<string[]>([])
const fileName = ref<string>('')

// Reader preferences
const fontSize = ref([20])
const dynamicStyle = computed(() => ({
  fontSize: `${fontSize.value[0]}px`,
  lineHeight: '1.8'
}))

// Search Logic
const isSearchOpen = ref(false)
const searchQuery = ref('')
const selectedSentence = ref<any>(null)
const isFetchingTranslation = ref(false)
const translatedText = ref('')

const toggleSearch = () => { 
  isSearchOpen.value = !isSearchOpen.value 
  if (!isSearchOpen.value) {
    searchQuery.value = ''
    selectedSentence.value = null
    translatedText.value = ''
  }
}

const selectSentence = (item: any) => {
  selectedSentence.value = item
  isFetchingTranslation.value = true
  translatedText.value = ''
  
  // Simulate an external API fetch for the specific sentence
  setTimeout(() => {
    translatedText.value = `[Mock API Response] Translated meaning for the sentence: "${item.text.substring(0, 30)}..."`
    isFetchingTranslation.value = false
  }, 1200)
}

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

// Break paragraphs into sentences for more granular search
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

const customFilter = () => 1 // Disable internal shadcn command filter so fuse handles it

const highlightText = (text: string, query: string) => {
  if (!query) return text
  const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${safeQuery})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/60 text-neutral-900 dark:text-neutral-100 px-0.5 rounded-sm shadow-sm">$1</mark>')
}

const onDrop = async (acceptedFiles: File[]) => {
  if (acceptedFiles.length === 0) return
  
  const file = acceptedFiles[0]
  if (file.type !== 'application/pdf') {
    alert('Please upload a valid PDF file.')
    return
  }

  fileName.value = file.name
  isParsing.value = true
  parsedParagraphs.value = []
  
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer))
    const pdf = await loadingTask.promise
    
    let fullText = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      
      let lastY = -1
      let pageText = ''
      
      for (const item of textContent.items as any[]) {
        if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 10) {
          pageText += '\n'
        }
        pageText += item.str + ' '
        lastY = item.transform[5]
      }
      fullText += pageText + '\n\n'
    }
    
    parsedParagraphs.value = fullText
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)

  } catch (error) {
    console.error('Error parsing PDF:', error)
    alert('Failed to parse PDF.')
  } finally {
    isParsing.value = false
  }
}

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: 'application/pdf',
  multiple: false
})
</script>

<template>
  <div class="min-h-[100dvh] max-w-[1440px] mx-auto bg-[#FDFBF7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors duration-300">
    
    <!-- Search Command Dialog -->
    <CommandDialog v-model:open="isSearchOpen" :filter-function="customFilter" class="max-w-6xl w-[95vw] sm:w-[90vw]">
      <div class="flex flex-col md:flex-row h-full min-h-[50vh]">
        
        <!-- Left Pane: Search & List -->
        <div class="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800">
          <CommandInput placeholder="Search for keywords or phrases..." v-model="searchQuery" />
          <CommandList class="flex-1 overflow-y-auto max-h-[50vh] md:max-h-[70vh]">
            <CommandEmpty v-if="searchQuery.length > 0 && searchResults.length === 0" class="py-12 text-center text-neutral-500">
              No matches found for "<span class="font-medium text-neutral-900 dark:text-neutral-100">{{ searchQuery }}</span>"
            </CommandEmpty>
            
            <CommandGroup v-if="searchResults.length > 0" heading="Fuzzy Matches (Sentences)">
              <CommandItem 
                v-for="res in searchResults" 
                :key="res.item.id" 
                :value="res.item.id"
                @select="selectSentence(res.item)"
                class="flex flex-col p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 items-start hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors duration-200 w-full cursor-pointer aria-selected:bg-neutral-100 dark:aria-selected:bg-neutral-800"
              >
                <p class="text-sm md:text-base text-neutral-900 dark:text-neutral-200 font-serif leading-relaxed line-clamp-3" v-html="highlightText(res.item.text, searchQuery)"></p>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </div>

        <!-- Right Pane: Translator Box -->
        <div class="w-full md:w-1/2 bg-neutral-50/50 dark:bg-neutral-900/30 p-6 md:p-10 overflow-y-auto max-h-[50vh] md:max-h-[70vh]">
          <div v-if="selectedSentence" class="space-y-10">
            <div>
              <h3 class="text-[10px] font-bold uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-4 flex items-center gap-2">
                <FileText class="w-3 h-3" /> Original Context
              </h3>
              <p class="text-base md:text-lg text-neutral-900 dark:text-neutral-100 font-serif leading-relaxed" v-html="highlightText(selectedSentence.text, searchQuery)"></p>
            </div>
            
            <div class="w-full h-px bg-neutral-200 dark:bg-neutral-800"></div>

            <div>
              <h3 class="text-[10px] font-bold uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-4 flex items-center justify-between">
                <span class="flex items-center gap-2"><Search class="w-3 h-3" /> Translation API</span>
                <span v-if="isFetchingTranslation" class="px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[9px] text-neutral-500 uppercase tracking-widest animate-pulse">Fetching</span>
              </h3>
              
              <div v-if="isFetchingTranslation" class="flex flex-col gap-3">
                <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 animate-pulse"></div>
                <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full animate-pulse"></div>
                <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6 animate-pulse"></div>
              </div>
              
              <p v-else class="text-base md:text-lg text-neutral-600 dark:text-neutral-400 font-serif leading-relaxed">
                {{ translatedText }}
              </p>
            </div>
          </div>
          
          <!-- Empty State for Translator Box -->
          <div v-else class="h-full flex flex-col items-center justify-center text-center text-neutral-400 dark:text-neutral-600 space-y-4">
            <div class="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Search class="w-6 h-6 opacity-50" />
            </div>
            <p class="text-sm max-w-[200px] leading-relaxed">Select a search result from the left to view its full context and fetch the API translation.</p>
          </div>
        </div>

      </div>
    </CommandDialog>

    <!-- Header / Nav -->
    <header v-if="parsedParagraphs.length > 0" class="sticky top-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 bg-[#FDFBF7]/90 dark:bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-colors duration-300">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center shrink-0">
          <FileText class="w-5 h-5 text-white dark:text-neutral-900" />
        </div>
        <div class="hidden sm:block">
          <h2 class="font-semibold tracking-tight text-sm text-neutral-900 dark:text-neutral-100 truncate max-w-[200px] lg:max-w-[400px]">{{ fileName }}</h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-0.5">Parallel Reader</p>
        </div>
      </div>
      
      <!-- Toolbar controls -->
      <div class="flex items-center gap-2 sm:gap-4 md:gap-6 bg-white/50 dark:bg-neutral-900/50 px-4 sm:px-6 py-2 rounded-full border border-neutral-200/50 dark:border-neutral-800/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-colors duration-300">
        
        <!-- Search Toggle -->
        <button 
          @click="toggleSearch"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500 dark:text-neutral-400 group"
          title="Search Document"
        >
          <Search class="w-4 h-4 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
          <span class="text-xs font-medium hidden lg:inline-block border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded text-neutral-400 dark:text-neutral-500">⌘K</span>
        </button>

        <div class="w-px h-4 bg-neutral-200 dark:bg-neutral-800"></div>

        <!-- Font Size Slider -->
        <div class="flex items-center gap-3">
          <Type class="w-4 h-4 text-neutral-400" />
          <Slider 
            v-model="fontSize" 
            :min="14" 
            :max="32" 
            :step="1" 
            class="w-24 sm:w-32 cursor-pointer"
          />
          <span class="text-xs font-medium w-8 text-right text-neutral-500 dark:text-neutral-400 hidden sm:block">{{ fontSize[0] }}px</span>
        </div>

        <div class="w-px h-4 bg-neutral-200 dark:bg-neutral-800"></div>

        <!-- Theme Toggle -->
        <button 
          @click="toggleDark()"
          class="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500 dark:text-neutral-400"
          title="Toggle Dark Mode"
        >
          <Sun v-if="isDark" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Upload State (Empty) -->
    <main v-if="parsedParagraphs.length === 0" class="flex flex-col items-center justify-center min-h-[100dvh] p-4 md:p-8">
      <button 
        @click="toggleDark()"
        class="absolute top-6 right-6 p-3 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500 dark:text-neutral-400"
      >
        <Sun v-if="isDark" class="w-5 h-5" />
        <Moon v-else class="w-5 h-5" />
      </button>

      <div class="max-w-4xl w-full flex flex-col items-center text-center space-y-12">
        <div class="space-y-6">
          <div class="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-bold bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 shadow-sm">
            Local Processing
          </div>
          <h1 class="text-5xl md:text-7xl tracking-tighter leading-none font-medium text-neutral-900 dark:text-neutral-100" style="font-family: 'Merriweather', serif;">
            Parallel Translator
          </h1>
          <p class="text-lg md:text-xl text-neutral-500 dark:text-neutral-400 max-w-[55ch] mx-auto leading-relaxed">
            Upload your document to begin an immersive, side-by-side reading experience. Your files remain entirely on your device.
          </p>
        </div>

        <!-- Double-Bezel Upload Container -->
        <div class="w-full max-w-2xl p-2 rounded-[2.5rem] bg-neutral-100/50 dark:bg-neutral-900/50 ring-1 ring-neutral-200/50 dark:ring-neutral-800/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-300">
          <div 
            v-bind="getRootProps()" 
            class="relative overflow-hidden rounded-[calc(2.5rem-8px)] bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 p-12 sm:p-20 flex flex-col items-center justify-center gap-6 cursor-pointer group transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <input v-bind="getInputProps()" />
            <div class="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-50/50 dark:to-neutral-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div v-if="isParsing" class="flex flex-col items-center gap-4 z-10">
              <div class="w-12 h-12 border-2 border-neutral-200 dark:border-neutral-700 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
              <p class="text-sm font-medium text-neutral-600 dark:text-neutral-400 animate-pulse">Extracting typography...</p>
            </div>

            <div v-else class="flex flex-col items-center gap-6 z-10">
              <div class="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-inner dark:shadow-none">
                <UploadCloud class="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
              </div>
              <div class="space-y-2">
                <p class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  <span v-if="isDragActive">Drop to parse</span>
                  <span v-else>Select or drag a PDF</span>
                </p>
                <p class="text-sm text-neutral-400 font-medium">Locally extracted. No cloud uploads.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Reader State (Split Screen) -->
    <main v-else class="flex flex-col lg:flex-row w-full min-h-[calc(100dvh-73px)]">
      
      <!-- Source Text Column -->
      <!-- Reduced extreme padding to maximize reading width and added max-w-4xl to ensure comfortable line lengths -->
      <section class="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-neutral-200/50 dark:border-neutral-800/50 bg-[#FDFBF7] dark:bg-neutral-950 overflow-y-auto px-6 md:px-12 lg:px-16 py-12 lg:py-24 transition-colors duration-300">
        <div class="w-full max-w-4xl mx-auto space-y-12">
          <div class="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500 mb-16 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            Original Source
          </div>
          <div 
            v-for="(paragraph, index) in parsedParagraphs" 
            :key="`source-${index}`"
            class="hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 p-4 sm:p-6 -mx-4 sm:-mx-6 rounded-3xl transition-colors duration-300 ease-out cursor-text"
          >
            <p 
              class="text-neutral-900 dark:text-neutral-200 text-justify font-serif" 
              :style="{ ...dynamicStyle, fontFamily: `'Lora', serif` }"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
      </section>

      <!-- Target Text Column (Placeholder for translation) -->
      <section class="w-full lg:w-1/2 bg-white dark:bg-neutral-900 overflow-y-auto px-6 md:px-12 lg:px-16 py-12 lg:py-24 lg:shadow-[inset_1px_0_0_rgba(0,0,0,0.02)] dark:lg:shadow-[inset_1px_0_0_rgba(255,255,255,0.02)] transition-colors duration-300">
        <div class="w-full max-w-4xl mx-auto space-y-12">
          <div class="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500 mb-16 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span>Translation</span>
            <span class="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] tracking-widest shadow-sm dark:shadow-none">Awaiting Model</span>
          </div>
          <div 
            v-for="(paragraph, index) in parsedParagraphs" 
            :key="`target-${index}`"
            class="p-4 sm:p-6 -mx-4 sm:-mx-6 rounded-3xl opacity-40 dark:opacity-30 hover:opacity-100 transition-opacity duration-500 ease-out"
          >
            <p 
              class="text-neutral-500 dark:text-neutral-400 text-justify font-serif blur-[2px] hover:blur-none transition-all duration-500" 
              :style="{ ...dynamicStyle, fontFamily: `'Lora', serif` }"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
      </section>

    </main>
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