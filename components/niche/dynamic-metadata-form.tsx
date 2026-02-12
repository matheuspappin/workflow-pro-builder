"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface FieldConfig {
  type: 'string' | 'number' | 'date' | 'textarea' | 'select' | 'multiselect' | 'tags' | 'boolean'
  label: string
  required?: boolean
  options?: string[]
  placeholder?: string
}

interface DynamicMetadataFormProps {
  schema: Record<string, FieldConfig>
  value: any
  onChange: (value: any) => void
  errors?: Record<string, string>
}

export function DynamicMetadataForm({ schema, value = {}, onChange, errors = {} }: DynamicMetadataFormProps) {
  const handleChange = (key: string, val: any) => {
    onChange({
      ...value,
      [key]: val
    })
  }

  if (!schema || Object.keys(schema).length === 0) {
    return null
  }

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
        Informações Adicionais
      </h4>
      <div className="grid gap-4">
        {Object.entries(schema).map(([key, config]) => {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex gap-1">
                {config.label}
                {config.required && <span className="text-red-500">*</span>}
              </Label>
              
              {config.type === 'string' && (
                <Input
                  id={key}
                  value={value[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={config.placeholder}
                  className="bg-background"
                />
              )}

              {config.type === 'number' && (
                <Input
                  id={key}
                  type="number"
                  value={value[key] || ''}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                  placeholder={config.placeholder}
                  className="bg-background"
                />
              )}

              {config.type === 'textarea' && (
                <Textarea
                  id={key}
                  value={value[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={config.placeholder}
                  className="bg-background min-h-[80px]"
                />
              )}

              {config.type === 'date' && (
                <Input
                  id={key}
                  type="date"
                  value={value[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="bg-background"
                />
              )}

              {config.type === 'select' && config.options && (
                <Select 
                  value={value[key] || ''} 
                  onValueChange={(val) => handleChange(key, val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.options.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {config.type === 'boolean' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id={key} 
                    checked={value[key] || false}
                    onCheckedChange={(checked) => handleChange(key, checked)}
                  />
                  <label
                    htmlFor={key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {config.placeholder || "Sim"}
                  </label>
                </div>
              )}

              {errors[key] && (
                <p className="text-xs text-red-500">{errors[key]}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
