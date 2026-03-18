import { ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const STORAGE_KEY_DATA = 'pdf_parsed_data'
const STORAGE_KEY_NAME = 'pdf_file_name'

export function usePdf() {
  const isParsing = ref(false)
  const parsedParagraphs = ref<string[]>([])
  const fileName = ref<string>('')
  const hasStorageError = ref(false)

  // Initialize from local storage
  try {
    const savedData = localStorage.getItem(STORAGE_KEY_DATA)
    const savedName = localStorage.getItem(STORAGE_KEY_NAME)
    if (savedData && savedName) {
      parsedParagraphs.value = JSON.parse(savedData)
      fileName.value = savedName
    }
  } catch (e) {
    console.error('Failed to load from local storage', e)
  }

  const deletePdf = () => {
    parsedParagraphs.value = []
    fileName.value = ''
    try {
      localStorage.removeItem(STORAGE_KEY_DATA)
      localStorage.removeItem(STORAGE_KEY_NAME)
    } catch (e) {
      console.error('Failed to clear local storage', e)
    }
  }

  const parsePdf = async (file: File) => {
    hasStorageError.value = false

    // Check size <= 5MB (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit. Please upload a smaller file.')
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
      
      const newParagraphs = fullText
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 0)
        
      parsedParagraphs.value = newParagraphs

      // Save to local storage
      try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(newParagraphs))
        localStorage.setItem(STORAGE_KEY_NAME, file.name)
      } catch (e: any) {
        hasStorageError.value = true
        console.error('Failed to save to local storage', e)
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          alert('Local storage quota exceeded. The file was parsed but could not be saved for future sessions. Try a smaller PDF.')
        } else {
          alert('Failed to save parsed data to local storage.')
        }
      }

    } catch (error) {
      console.error('Error parsing PDF:', error)
      alert('Failed to parse PDF.')
      fileName.value = ''
      parsedParagraphs.value = []
    } finally {
      isParsing.value = false
    }
  }

  return {
    isParsing,
    parsedParagraphs,
    fileName,
    parsePdf,
    deletePdf,
    hasStorageError
  }
}
