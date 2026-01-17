import { useCallback, useRef, useState } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptedTypes = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm'

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        onFileSelect(file)
      }
    }
  }, [onFileSelect])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }, [onFileSelect])

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-200
        ${isDragging
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3">
        <svg
          className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div>
          <p className="text-lg font-medium text-gray-700">
            {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to browse
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Supports: JPG, PNG, WebP, GIF, MP4, WebM
        </p>
      </div>
    </div>
  )
}
