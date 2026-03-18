<script setup lang="ts">
import { FileText, Search } from 'lucide-vue-next'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

defineProps<{
  open: boolean
  searchQuery: string
  searchResults: any[]
  selectedSentence: any
  isFetchingTranslation: boolean
  dictionaryData: any
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:searchQuery', value: string): void
  (e: 'select-sentence', item: any): void
}>()

const customFilter = () => 1 // Disable internal shadcn command filter so fuse handles it

const highlightText = (text: string, query: string) => {
  if (!query) return text
  const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${safeQuery})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/60 text-neutral-900 dark:text-neutral-100 px-0.5 rounded-sm shadow-sm">$1</mark>')
}

const onUpdateOpen = (val: boolean) => {
  emit('update:open', val)
}

const onUpdateSearchQuery = (val: string | number) => {
  emit('update:searchQuery', String(val))
}
</script>

<template>
  <CommandDialog :open="open" @update:open="onUpdateOpen" :filter-function="customFilter" class="max-w-6xl w-[95vw] sm:w-[90vw]">
    <div class="flex flex-col md:flex-row h-full min-h-[50vh]">
      
      <!-- Left Pane: Search & List -->
      <div class="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800">
        <CommandInput placeholder="Search for keywords or phrases..." :model-value="searchQuery" @update:model-value="onUpdateSearchQuery" />
        <CommandList class="flex-1 overflow-y-auto max-h-[50vh] md:max-h-[70vh]">
          <CommandEmpty v-if="searchQuery.length > 0 && searchResults.length === 0" class="py-12 text-center text-neutral-500">
            No matches found for "<span class="font-medium text-neutral-900 dark:text-neutral-100">{{ searchQuery }}</span>"
          </CommandEmpty>
          
          <CommandGroup v-if="searchResults.length > 0" heading="Fuzzy Matches (Sentences)">
            <CommandItem 
              v-for="res in searchResults" 
              :key="res.item.id" 
              :value="res.item.id"
              @select="emit('select-sentence', res.item)"
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
            
            <div v-else class="text-base md:text-lg text-neutral-600 dark:text-neutral-400 font-serif leading-relaxed">
              <div v-if="dictionaryData && !dictionaryData.error && Array.isArray(dictionaryData)">
                <div v-for="(entry, index) in dictionaryData" :key="index" class="mb-8 last:mb-0">
                  <div class="flex items-baseline gap-3 mb-3">
                    <span class="font-bold text-neutral-900 dark:text-neutral-100 text-2xl font-sans">{{ entry.word }}</span>
                    <span v-if="entry.phonetic" class="text-sm text-neutral-500 font-sans tracking-wide">{{ entry.phonetic }}</span>
                  </div>
                  
                  <div v-for="(meaning, mIdx) in entry.meanings" :key="mIdx" class="mb-6 last:mb-0">
                    <div class="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2 border-b border-neutral-100 dark:border-neutral-800 pb-2 flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
                      {{ meaning.partOfSpeech }}
                    </div>
                    
                    <ul class="space-y-4 mt-3">
                      <li v-for="(def, dIdx) in meaning.definitions" :key="dIdx" class="text-sm md:text-base group flex flex-col">
                        <div class="flex gap-3">
                          <span class="text-neutral-300 dark:text-neutral-600 font-sans text-xs mt-1 min-w-[1.25rem]">{{ Number(dIdx) + 1 }}.</span>
                          <span class="text-neutral-800 dark:text-neutral-200 leading-relaxed">{{ def.definition }}</span>
                        </div>
                        <div v-if="def.example" class="text-neutral-500 dark:text-neutral-400 mt-2 ml-8 pl-3 border-l-[3px] border-neutral-200 dark:border-neutral-800 italic leading-relaxed text-sm">
                          "{{ def.example }}"
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div v-else-if="dictionaryData?.error" class="flex flex-col items-center justify-center py-10 text-center text-neutral-400">
                <Search class="w-8 h-8 mb-4 opacity-20" />
                <p class="text-sm">{{ dictionaryData.error }}</p>
              </div>
            </div>
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
</template>
