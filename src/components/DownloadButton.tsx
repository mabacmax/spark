import { useState } from 'react'
import { useMediaProcessor } from '../hooks/useMediaProcessor'
import type { Adjustments } from './MediaPreview'

interface DownloadButtonProps {
  file: File
  adjustments: Adjustments
}

export function DownloadButton({ file, adjustments }: DownloadButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { processImage, downloadBlob } = useMediaProcessor()

  const isVideo = file.type.startsWith('video/')

  const handleDownload = async () => {
    if (isVideo) {
      downloadBlob(file, file.name)
      return
    }

    setIsProcessing(true)
    try {
      const format = file.type === 'image/jpeg' ? 'jpeg' : 'png'
      const blob = await processImage(file, adjustments, format)
      const extension = format === 'jpeg' ? 'jpg' : 'png'
      const baseName = file.name.replace(/\.[^/.]+$/, '')
      downloadBlob(blob, `${baseName}-edited.${extension}`)
    } catch (error) {
      console.error('Failed to process image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isProcessing}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium
        transition-all duration-200
        ${isProcessing
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
        }
      `}
    >
      {isProcessing ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </>
      )}
    </button>
  )
}
