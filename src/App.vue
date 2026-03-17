<script setup lang="ts">
import { ref } from 'vue'
import { useDropzone } from 'vue3-dropzone'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

// shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadCloud, CheckCircle } from 'lucide-vue-next'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const isParsing = ref(false)
const parsedText = ref<string>('')
const fileName = ref<string>('')
const filePages = ref<number>(0)

const onDrop = async (acceptedFiles: File[]) => {
  if (acceptedFiles.length === 0) return
  
  const file = acceptedFiles[0]
  if (file.type !== 'application/pdf') {
    alert('Please upload a valid PDF file.')
    return
  }

  fileName.value = file.name
  isParsing.value = true
  parsedText.value = ''
  
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer))
    const pdf = await loadingTask.promise
    
    filePages.value = pdf.numPages
    let fullText = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += `--- Page ${i} ---\n${pageText}\n\n`
    }
    
    parsedText.value = fullText
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
  <div class="min-h-screen bg-neutral-50 p-8 flex flex-col items-center justify-center font-sans">
    <Card class="w-full max-w-3xl shadow-lg">
      <CardHeader class="text-center space-y-2">
        <CardTitle class="text-3xl font-bold tracking-tight">Parallel Translator</CardTitle>
        <CardDescription class="text-base">
          Upload a PDF document to extract and view its text content locally.
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-6">
        <div 
          v-bind="getRootProps()" 
          class="border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-4"
          :class="isDragActive ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/50 hover:bg-neutral-50'"
        >
          <input v-bind="getInputProps()" />
          <UploadCloud class="w-12 h-12 text-neutral-400" />
          <div>
            <p class="text-lg font-medium text-neutral-700">
              <span v-if="isDragActive">Drop the PDF here...</span>
              <span v-else>Drag & drop a PDF here, or click to select</span>
            </p>
            <p class="text-sm text-neutral-500 mt-1">Only .pdf files are supported</p>
          </div>
        </div>

        <div v-if="isParsing" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span class="ml-3 text-neutral-600 font-medium">Parsing PDF document...</span>
        </div>

        <div v-else-if="parsedText" class="space-y-4">
          <div class="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <CheckCircle class="w-5 h-5" />
            <div>
              <p class="font-medium">Successfully parsed {{ fileName }}</p>
              <p class="text-sm opacity-90">Extracted {{ filePages }} pages of text.</p>
            </div>
          </div>
          
          <div class="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto shadow-inner">
            <pre class="whitespace-pre-wrap font-sans text-sm text-neutral-700 leading-relaxed">{{ parsedText }}</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
