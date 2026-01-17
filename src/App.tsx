import { useState } from 'react'
import { FileUpload } from './components/FileUpload'
import { MediaPreview, type Adjustments } from './components/MediaPreview'
import { AdjustmentPanel } from './components/AdjustmentPanel'
import { DownloadButton } from './components/DownloadButton'

const defaultAdjustments: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
}

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setAdjustments(defaultAdjustments)
  }

  const handleReset = () => {
    setAdjustments(defaultAdjustments)
  }

  const handleClear = () => {
    setFile(null)
    setAdjustments(defaultAdjustments)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Spark
          </h1>
          <p className="text-gray-500 mt-2">
            Upload, adjust, and download your photos and videos
          </p>
        </header>

        <main className="space-y-6">
          {!file ? (
            <FileUpload onFileSelect={handleFileSelect} />
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={handleClear}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              </div>

              <MediaPreview file={file} adjustments={adjustments} />

              <AdjustmentPanel
                adjustments={adjustments}
                onChange={setAdjustments}
                onReset={handleReset}
              />

              <div className="flex justify-center">
                <DownloadButton file={file} adjustments={adjustments} />
              </div>
            </>
          )}
        </main>

        <footer className="text-center text-xs text-gray-400 mt-12">
          All processing happens locally in your browser
        </footer>
      </div>
    </div>
  )
}

export default App
