<script setup lang="ts">
import { FileText, Type, Search, Moon, Sun, Trash2, LayoutTemplate } from 'lucide-vue-next'
import { Slider } from '@/components/ui/slider'
import { useDark, useToggle } from '@vueuse/core'

defineProps<{
  fileName: string
  fontSize: number[]
  activeTab: 'search' | 'reader'
}>()

const emit = defineEmits<{
  (e: 'update:fontSize', value: number[]): void
  (e: 'update:activeTab', value: 'search' | 'reader'): void
  (e: 'delete-document'): void
}>()

const isDark = useDark()
const toggleDark = useToggle(isDark)

const updateFontSize = (val: number[] | undefined) => {
  if (val) emit('update:fontSize', val)
}
</script>

<template>
  <header class="sticky top-0 z-40 flex flex-col md:flex-row items-start md:items-center justify-between px-6 md:px-8 py-4 bg-[#FDFBF7]/90 dark:bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-colors duration-300 gap-4">
    <div class="flex items-center gap-4 w-full md:w-auto justify-between">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center shrink-0">
          <FileText class="w-5 h-5 text-white dark:text-neutral-900" />
        </div>
        <div>
          <h2 class="font-semibold tracking-tight text-sm text-neutral-900 dark:text-neutral-100 truncate max-w-[200px] lg:max-w-[400px]">{{ fileName }}</h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-0.5">Parallel Reader</p>
        </div>
      </div>
      
      <!-- Close/Delete Document (Mobile) -->
      <button 
        @click="emit('delete-document')"
        class="md:hidden p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-500"
        title="Close Document"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
    
    <!-- Toolbar controls -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-4 md:gap-6 bg-white/50 dark:bg-neutral-900/50 px-4 sm:px-6 py-2 rounded-full border border-neutral-200/50 dark:border-neutral-800/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-colors duration-300 w-full md:w-auto justify-center">
      
      <!-- Tabs -->
      <div class="flex items-center gap-1 bg-neutral-100/50 dark:bg-neutral-800/50 p-1 rounded-full">
        <button 
          @click="emit('update:activeTab', 'search')"
          :class="[
            'flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors text-sm font-medium',
            activeTab === 'search' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
          ]"
        >
          <Search class="w-4 h-4" />
          <span class="hidden sm:inline-block">Search & Translate</span>
        </button>
        <button 
          @click="emit('update:activeTab', 'reader')"
          :class="[
            'flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors text-sm font-medium',
            activeTab === 'reader' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
          ]"
        >
          <LayoutTemplate class="w-4 h-4" />
          <span class="hidden sm:inline-block">Document View</span>
        </button>
      </div>

      <div class="hidden md:block w-px h-4 bg-neutral-200 dark:bg-neutral-800"></div>

      <!-- Font Size Slider -->
      <div class="flex items-center gap-3">
        <Type class="w-4 h-4 text-neutral-400" />
        <Slider 
          :model-value="fontSize" 
          @update:model-value="updateFontSize"
          :min="14" 
          :max="32" 
          :step="1" 
          class="w-24 sm:w-24 cursor-pointer"
        />
        <span class="text-xs font-medium w-8 text-right text-neutral-500 dark:text-neutral-400 hidden sm:block">{{ fontSize[0] }}px</span>
      </div>

      <div class="hidden md:block w-px h-4 bg-neutral-200 dark:bg-neutral-800"></div>

      <!-- Theme Toggle -->
      <button 
        @click="toggleDark()"
        class="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500 dark:text-neutral-400"
        title="Toggle Dark Mode"
      >
        <Sun v-if="isDark" class="w-4 h-4" />
        <Moon v-else class="w-4 h-4" />
      </button>

      <!-- Close/Delete Document (Desktop) -->
      <button 
        @click="emit('delete-document')"
        class="hidden md:flex p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-500"
        title="Close Document"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
