import { useEffect, useRef } from 'react'

export interface Adjustments {
  brightness: number
  contrast: number
  saturation: number
}

interface MediaPreviewProps {
  file: File
  adjustments: Adjustments
  onImageLoad?: (img: HTMLImageElement) => void
}

export function MediaPreview({ file, adjustments, onImageLoad }: MediaPreviewProps) {
  const isVideo = file.type.startsWith('video/')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const filterStyle = `
    brightness(${1 + adjustments.brightness / 100})
    contrast(${1 + adjustments.contrast / 100})
    saturate(${1 + adjustments.saturation / 100})
  `.trim()

  useEffect(() => {
    if (isVideo) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      imageRef.current = img

      const maxWidth = 800
      const maxHeight = 600
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height
      ctx.filter = filterStyle
      ctx.drawImage(img, 0, 0, width, height)

      onImageLoad?.(img)
    }
    img.src = URL.createObjectURL(file)

    return () => {
      URL.revokeObjectURL(img.src)
    }
  }, [file, isVideo, onImageLoad])

  useEffect(() => {
    if (isVideo || !imageRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.filter = filterStyle
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
  }, [adjustments, filterStyle, isVideo])

  if (isVideo) {
    return (
      <div className="flex justify-center">
        <video
          ref={videoRef}
          src={URL.createObjectURL(file)}
          controls
          className="max-w-full max-h-[600px] rounded-lg"
          style={{ filter: filterStyle }}
        />
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full rounded-lg shadow-lg"
      />
    </div>
  )
}
