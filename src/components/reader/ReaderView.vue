<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  parsedParagraphs: string[]
  fontSize: number
}>()

const dynamicStyle = computed(() => ({
  fontSize: `${props.fontSize}px`,
  lineHeight: '1.8'
}))
</script>

<template>
  <main class="flex flex-col lg:flex-row w-full min-h-[calc(100dvh-73px)]">
    <!-- Source Text Column -->
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
</template>
