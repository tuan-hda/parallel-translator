import { ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export function usePdf() {
  const isParsing = ref(false)
  const parsedParagraphs = ref<string[]>([])
  const fileName = ref<string>('')

  const parsePdf = async (file: File) => {
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

  return {
    isParsing,
    parsedParagraphs,
    fileName,
    parsePdf
  }
}
