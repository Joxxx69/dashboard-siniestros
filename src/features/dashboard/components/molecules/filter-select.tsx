'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ALL_VALUE = '__all__'

interface Option {
  readonly value: string
  readonly label: string
}

interface FilterSelectProps {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly options: readonly Option[]
  readonly placeholder?: string
}

export function FilterSelect({ label, value, onChange, options, placeholder = 'Todos' }: FilterSelectProps) {
  const selectValue = value || ALL_VALUE
  const handleChange = (v: string) => onChange(v === ALL_VALUE ? '' : v)

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-white/75 text-xs font-medium">{label}</Label>
      <Select value={selectValue} onValueChange={handleChange}>
        <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm h-9 focus:ring-white/30 [&>span]:text-white/80">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{placeholder}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
