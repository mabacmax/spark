import type { Adjustments } from './MediaPreview'

interface AdjustmentPanelProps {
  adjustments: Adjustments
  onChange: (adjustments: Adjustments) => void
  onReset: () => void
}

interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function Slider({ label, value, onChange }: SliderProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-24 text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type="range"
        min="-100"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <span className="w-12 text-right text-sm text-gray-600 tabular-nums">
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  )
}

export function AdjustmentPanel({ adjustments, onChange, onReset }: AdjustmentPanelProps) {
  const handleChange = (key: keyof Adjustments) => (value: number) => {
    onChange({ ...adjustments, [key]: value })
  }

  const hasChanges = adjustments.brightness !== 0 ||
    adjustments.contrast !== 0 ||
    adjustments.saturation !== 0

  return (
    <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
      <Slider
        label="Brightness"
        value={adjustments.brightness}
        onChange={handleChange('brightness')}
      />
      <Slider
        label="Contrast"
        value={adjustments.contrast}
        onChange={handleChange('contrast')}
      />
      <Slider
        label="Saturation"
        value={adjustments.saturation}
        onChange={handleChange('saturation')}
      />
      {hasChanges && (
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Reset to defaults
        </button>
      )}
    </div>
  )
}
