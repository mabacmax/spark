import { useCallback, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface SanitizeOptions {
  stripMetadata?: boolean
  deterministicEncoding?: boolean
  outputFormat?: string
}

interface PIIRemovalOptions {
  outputFormat?: string
}

interface PrivacyGrainOptions {
  outputFormat?: string
  stripMetadata?: boolean
}

interface LuminaEngineState {
  isLoaded: boolean
  isProcessing: boolean
  progress: number
  error: string | null
}

export function useLuminaEngine() {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [state, setState] = useState<LuminaEngineState>({
    isLoaded: false,
    isProcessing: false,
    progress: 0,
    error: null,
  })

  const load = useCallback(async () => {
    if (ffmpegRef.current?.loaded) {
      setState((prev) => ({ ...prev, isLoaded: true }))
      return
    }

    try {
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg

      ffmpeg.on('progress', ({ progress }) => {
        setState((prev) => ({ ...prev, progress: Math.round(progress * 100) }))
      })

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      setState((prev) => ({ ...prev, isLoaded: true, error: null }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load FFmpeg'
      setState((prev) => ({ ...prev, error: errorMessage }))
      throw err
    }
  }, [])

  /**
   * Sanitizes media files by stripping metadata and enabling deterministic encoding.
   *
   * FFmpeg flags used:
   * - `-map_metadata -1`: Strips all metadata (timestamps, encoder info, GPS, device info, etc.)
   * - `-fflags +bitexact`: Enables bitexact mode for reproducible muxing
   * - `-flags:v +bitexact`: Enables bitexact mode for video encoding
   * - `-flags:a +bitexact`: Enables bitexact mode for audio encoding (if present)
   */
  const sanitize = useCallback(
    async (
      file: File,
      options: SanitizeOptions = {}
    ): Promise<Blob> => {
      const {
        stripMetadata = true,
        deterministicEncoding = true,
        outputFormat,
      } = options

      if (!ffmpegRef.current?.loaded) {
        throw new Error('FFmpeg not loaded. Call load() first.')
      }

      const ffmpeg = ffmpegRef.current

      setState((prev) => ({ ...prev, isProcessing: true, progress: 0, error: null }))

      try {
        const inputFileName = 'input' + getExtension(file.name)
        const outputExt = outputFormat || getExtension(file.name)
        const outputFileName = 'output' + outputExt

        await ffmpeg.writeFile(inputFileName, await fetchFile(file))

        const ffmpegArgs: string[] = ['-i', inputFileName]

        if (stripMetadata) {
          ffmpegArgs.push('-map_metadata', '-1')
        }

        if (deterministicEncoding) {
          ffmpegArgs.push('-fflags', '+bitexact')
          ffmpegArgs.push('-flags:v', '+bitexact')
          ffmpegArgs.push('-flags:a', '+bitexact')
        }

        ffmpegArgs.push('-y', outputFileName)

        await ffmpeg.exec(ffmpegArgs)

        const data = await ffmpeg.readFile(outputFileName)
        const mimeType = getMimeType(outputExt)
        const uint8Array = data instanceof Uint8Array ? data : new TextEncoder().encode(data)
        const blob = new Blob([new Uint8Array(uint8Array)], { type: mimeType })

        await ffmpeg.deleteFile(inputFileName)
        await ffmpeg.deleteFile(outputFileName)

        setState((prev) => ({ ...prev, isProcessing: false, progress: 100 }))

        return blob
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sanitization failed'
        setState((prev) => ({ ...prev, isProcessing: false, error: errorMessage }))
        throw err
      }
    },
    []
  )

  /**
   * Sanitizes media for reproducible outputs in CI/CD regression testing.
   * Strips all metadata and uses deterministic encoding for consistent binary signatures.
   */
  const sanitizeForCI = useCallback(
    async (file: File, outputFormat?: string): Promise<Blob> => {
      return sanitize(file, {
        stripMetadata: true,
        deterministicEncoding: true,
        outputFormat,
      })
    },
    [sanitize]
  )

  /**
   * Removes PII (Personally Identifiable Information) from media files.
   *
   * Strips all non-essential metadata that could leak sensitive information:
   * - GPS coordinates and location data
   * - Device make, model, and serial numbers
   * - Camera settings and lens information
   * - Creation timestamps and modification dates
   * - Software and operating system identifiers
   * - User comments and annotations
   * - Thumbnail images (which may contain unredacted content)
   *
   * Also applies deterministic encoding to eliminate device-specific fingerprints
   * that could be used to identify the source device or software.
   *
   * Use this function before sharing media to protect user privacy.
   */
  const removePII = useCallback(
    async (file: File, options: PIIRemovalOptions = {}): Promise<Blob> => {
      return sanitize(file, {
        stripMetadata: true,
        deterministicEncoding: true,
        outputFormat: options.outputFormat,
      })
    },
    [sanitize]
  )

  /**
   * Applies subtle temporal grain to video for enhanced digital privacy.
   *
   * Adds a low-intensity noise filter that creates a unique binary signature
   * for each processed file, preventing cross-platform hash tracking while
   * maintaining high visual quality.
   *
   * FFmpeg filter used:
   * - `noise=alls=3:allf=t+u`: Applies strength-3 temporal uniform noise to all planes
   *   - alls=3: Low noise strength (scale 0-100) for minimal visual impact
   *   - allf=t+u: Temporal (t) + uniform (u) distribution for natural grain appearance
   *
   * Also strips metadata by default for comprehensive privacy protection.
   */
  const applyPrivacyGrain = useCallback(
    async (file: File, options: PrivacyGrainOptions = {}): Promise<Blob> => {
      const { outputFormat, stripMetadata = true } = options

      if (!ffmpegRef.current?.loaded) {
        throw new Error('FFmpeg not loaded. Call load() first.')
      }

      const ffmpeg = ffmpegRef.current

      setState((prev) => ({ ...prev, isProcessing: true, progress: 0, error: null }))

      try {
        const inputFileName = 'input' + getExtension(file.name)
        const outputExt = outputFormat || getExtension(file.name)
        const outputFileName = 'output' + outputExt

        await ffmpeg.writeFile(inputFileName, await fetchFile(file))

        const ffmpegArgs: string[] = ['-i', inputFileName]

        if (stripMetadata) {
          ffmpegArgs.push('-map_metadata', '-1')
        }

        ffmpegArgs.push('-vf', 'noise=alls=3:allf=t+u')
        ffmpegArgs.push('-y', outputFileName)

        await ffmpeg.exec(ffmpegArgs)

        const data = await ffmpeg.readFile(outputFileName)
        const mimeType = getMimeType(outputExt)
        const uint8Array = data instanceof Uint8Array ? data : new TextEncoder().encode(data)
        const blob = new Blob([new Uint8Array(uint8Array)], { type: mimeType })

        await ffmpeg.deleteFile(inputFileName)
        await ffmpeg.deleteFile(outputFileName)

        setState((prev) => ({ ...prev, isProcessing: false, progress: 100 }))

        return blob
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Privacy grain failed'
        setState((prev) => ({ ...prev, isProcessing: false, error: errorMessage }))
        throw err
      }
    },
    []
  )

  return {
    load,
    sanitize,
    sanitizeForCI,
    removePII,
    applyPrivacyGrain,
    isLoaded: state.isLoaded,
    isProcessing: state.isProcessing,
    progress: state.progress,
    error: state.error,
  }
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/)
  return match ? match[0] : '.mp4'
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  }
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}
