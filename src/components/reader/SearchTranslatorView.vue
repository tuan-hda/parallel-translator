<script setup lang="ts">
import { ref } from 'vue'
import { FileText, Search, List, Languages } from 'lucide-vue-next'

defineProps<{
  searchQuery: string
  searchResults: any[]
  selectedSentence: any
  isFetchingTranslation: boolean
  dictionaryData: any
  translationEnVi: string[] | null
  sentenceTranslationEnVi: string | null
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'select-sentence', item: any): void
}>()

const activeTab = ref<'results' | 'translation'>('results')

const highlightText = (text: string, query: string) => {
  if (!query) return text
  const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${safeQuery})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/60 text-neutral-900 dark:text-neutral-100 px-0.5 rounded-sm shadow-sm">$1</mark>')
}

const onUpdateSearchQuery = (val: string | number) => {
  emit('update:searchQuery', String(val))
}

const selectSentenceAndSwitchTab = (item: any) => {
  emit('select-sentence', item)
  // On mobile, automatically switch to translation tab when a sentence is selected
  if (window.innerWidth < 768) {
    activeTab.value = 'translation'
  }
}
</script>

<template>
  <div class="flex-1 w-full bg-white dark:bg-neutral-950 flex flex-col md:flex-row shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden h-[calc(100vh-80px)]">
    <!-- Mobile Tab Navigation -->
    <div class="md:hidden flex border-b border-neutral-200 dark:border-neutral-800">
      <button 
        @click="activeTab = 'results'"
        :class="[
          'flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors',
          activeTab === 'results' ? 'text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100' : 'text-neutral-400 dark:text-neutral-500'
        ]"
      >
        <List class="w-4 h-4" />
        Results ({{ searchResults.length }})
      </button>
      <button 
        @click="activeTab = 'translation'"
        :class="[
          'flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors',
          activeTab === 'translation' ? 'text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100' : 'text-neutral-400 dark:text-neutral-500'
        ]"
      >
        <Languages class="w-4 h-4" />
        Translation
      </button>
    </div>

    <!-- Left Pane: Search & List -->
    <div 
      :class="[
        'w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 h-full bg-[#FDFBF7] dark:bg-neutral-950 transition-all duration-300',
        activeTab !== 'results' ? 'hidden md:flex' : 'flex'
      ]"
    >
      <div class="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <input 
          class="w-full bg-transparent text-xl md:text-2xl placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none text-neutral-900 dark:text-neutral-100 font-sans"
          placeholder="Search for keywords or phrases..." 
          :value="searchQuery" 
          @input="onUpdateSearchQuery(($event.target as HTMLInputElement).value)" 
        />
      </div>
      <div class="flex-1 overflow-y-auto w-full">
        <div v-if="searchQuery.length > 0 && searchResults.length === 0" class="py-12 text-center text-neutral-500">
          No matches found for "<span class="font-medium text-neutral-900 dark:text-neutral-100">{{ searchQuery }}</span>"
        </div>
        
        <div v-if="searchResults.length > 0" class="w-full">
          <div class="px-4 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-100/50 dark:bg-neutral-900/50 sticky top-0">
            Fuzzy Matches (Sentences)
          </div>
          <div 
            v-for="res in searchResults" 
            :key="res.item.id" 
            @click="selectSentenceAndSwitchTab(res.item)"
            :class="[
              'flex flex-col p-5 md:p-6 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 items-start hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors duration-200 w-full cursor-pointer',
              selectedSentence?.id === res.item.id ? 'bg-neutral-100 dark:bg-neutral-800' : ''
            ]"
          >
            <p class="text-base md:text-xl text-neutral-900 dark:text-neutral-200 font-serif leading-relaxed" v-html="highlightText(res.item.text, searchQuery)"></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Pane: Translator Box -->
    <div 
      :class="[
        'w-full md:w-1/2 bg-neutral-50/50 dark:bg-neutral-900/30 p-6 md:p-12 overflow-y-auto min-h-full transition-all duration-300',
        activeTab !== 'translation' ? 'hidden md:block' : 'block'
      ]"
    >
      <div v-if="selectedSentence" class="space-y-12 max-w-2xl mx-auto">
        <div>
          <h3 class="text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-6 flex items-center gap-2">
            <FileText class="w-4 h-4" /> Original Context
          </h3>
          <p class="text-xl md:text-2xl text-neutral-900 dark:text-neutral-100 font-serif leading-relaxed" v-html="highlightText(selectedSentence.text, searchQuery)"></p>
        </div>
        
        <div class="w-full h-px bg-neutral-200 dark:bg-neutral-800"></div>

        <div>
          <h3 class="text-xs font-bold uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-6 flex items-center justify-between">
            <span class="flex items-center gap-2"><Search class="w-4 h-4" /> Translation & Dictionary</span>
            <span v-if="isFetchingTranslation" class="px-3 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] text-neutral-500 uppercase tracking-widest animate-pulse">Fetching</span>
          </h3>
          
          <div v-if="isFetchingTranslation" class="flex flex-col gap-4">
            <div class="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 animate-pulse"></div>
            <div class="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-full animate-pulse"></div>
            <div class="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6 animate-pulse"></div>
          </div>
          
          <div v-else class="space-y-10">
            <div v-if="dictionaryData && !dictionaryData.error && Array.isArray(dictionaryData)" class="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 font-serif leading-relaxed">
              <div v-for="(entry, index) in dictionaryData" :key="index" class="mb-10 last:mb-0">
                <div class="flex items-baseline gap-4 mb-4">
                  <span class="font-bold text-neutral-900 dark:text-neutral-100 text-4xl font-sans">{{ entry.word }}</span>
                  <span v-if="entry.phonetic" class="text-lg text-neutral-500 font-sans tracking-wide">{{ entry.phonetic }}</span>
                </div>
                
                <div v-for="(meaning, mIdx) in entry.meanings" :key="mIdx" class="mb-8 last:mb-0">
                  <div class="text-sm font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3 border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
                    {{ meaning.partOfSpeech }}
                  </div>
                  
                  <ul class="space-y-6 mt-4">
                    <li v-for="(def, dIdx) in meaning.definitions" :key="dIdx" class="group flex flex-col">
                      <div class="flex gap-4">
                        <span class="text-neutral-300 dark:text-neutral-600 font-sans text-sm mt-1.5 min-w-[1.5rem]">{{ Number(dIdx) + 1 }}.</span>
                        <span class="text-neutral-800 dark:text-neutral-200 leading-relaxed">{{ def.definition }}</span>
                      </div>
                      <div v-if="def.example" class="text-neutral-500 dark:text-neutral-400 mt-3 ml-10 pl-4 border-l-[3px] border-neutral-200 dark:border-neutral-800 italic leading-relaxed text-base md:text-lg">
                        "{{ def.example }}"
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div v-else-if="dictionaryData?.error" class="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
              <Search class="w-12 h-12 mb-6 opacity-20" />
              <p class="text-base">{{ dictionaryData.error }}</p>
            </div>

            <!-- English to Vietnamese Section -->
            <div v-if="translationEnVi && translationEnVi.length > 0" class="bg-white dark:bg-neutral-800/40 p-6 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm">
              <h4 class="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-red-400"></div> English to Vietnamese
              </h4>
              <ul class="space-y-3 mt-4 text-2xl md:text-3xl font-serif text-neutral-900 dark:text-neutral-100 leading-tight">
                <li v-for="(trans, tIdx) in translationEnVi" :key="tIdx" class="flex gap-4 items-start">
                  <span class="text-neutral-300 dark:text-neutral-600 font-sans text-lg mt-1.5 min-w-[1.5rem]">{{ Number(tIdx) + 1 }}.</span>
                  <span>{{ trans }}</span>
                </li>
              </ul>
            </div>

            <!-- Full Sentence Translation Section -->
            <div v-if="sentenceTranslationEnVi" class="bg-white dark:bg-neutral-800/40 p-6 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm">
              <h4 class="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Full Sentence Translation
              </h4>
              <p class="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 font-serif leading-relaxed italic">
                {{ sentenceTranslationEnVi }}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State for Translator Box -->
      <div v-else class="h-full flex flex-col items-center justify-center text-center text-neutral-400 dark:text-neutral-600 space-y-6">
        <div class="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <Search class="w-10 h-10 opacity-50" />
        </div>
        <p class="text-base md:text-lg max-w-[300px] leading-relaxed">Select a search result from the left to view its full context and fetch the API translation.</p>
      </div>
    </div>
  </div>
</template>
