import { useCallback } from 'react'
import type { Adjustments } from '../components/MediaPreview'

export function useMediaProcessor() {
  const processImage = useCallback(
    async (
      file: File,
      adjustments: Adjustments,
      format: 'png' | 'jpeg' = 'png'
    ): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          canvas.width = img.width
          canvas.height = img.height

          ctx.filter = `
            brightness(${1 + adjustments.brightness / 100})
            contrast(${1 + adjustments.contrast / 100})
            saturate(${1 + adjustments.saturation / 100})
          `.trim()

          ctx.drawImage(img, 0, 0)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to create blob'))
              }
            },
            `image/${format}`,
            format === 'jpeg' ? 0.92 : undefined
          )
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = URL.createObjectURL(file)
      })
    },
    []
  )

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { processImage, downloadBlob }
}
