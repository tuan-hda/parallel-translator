<script setup lang="ts">
import { useDropzone } from 'vue3-dropzone'
import { UploadCloud, Sun, Moon } from 'lucide-vue-next'
import { useDark, useToggle } from '@vueuse/core'

const props = defineProps<{
  isParsing: boolean
}>()

const emit = defineEmits<{
  (e: 'file-dropped', file: File): void
}>()

const isDark = useDark()
const toggleDark = useToggle(isDark)

const onDrop = (acceptedFiles: File[]) => {
  if (acceptedFiles.length === 0) return
  
  const file = acceptedFiles[0]
  if (file.type !== 'application/pdf') {
    alert('Please upload a valid PDF file.')
    return
  }
  
  emit('file-dropped', file)
}

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: 'application/pdf',
  multiple: false
})
</script>

<template>
  <main class="flex flex-col items-center justify-center min-h-[100dvh] p-4 md:p-8">
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
</template>
