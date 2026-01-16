'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BRDTemplate } from '@/lib/brd-templates'
import { Check } from 'lucide-react'

interface TemplateSelectorProps {
  templates: BRDTemplate[]
  selectedTemplate: BRDTemplate | null
  onSelect: (template: BRDTemplate) => void
  onContinue: () => void
}

export function TemplateSelector({
  templates,
  selectedTemplate,
  onSelect,
  onContinue,
}: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Select BRD Template</h2>
        <p className="text-muted-foreground">
          Choose a template that best fits your project requirements
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer p-6 transition-all hover:border-primary ${
              selectedTemplate?.id === template.id
                ? 'border-2 border-primary bg-primary/5'
                : 'border-2 border-transparent'
            }`}
            onClick={() => onSelect(template)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">{template.icon}</span>
                  <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{template.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Includes:</p>
                  <ul className="space-y-0.5">
                    {template.structure.slice(0, 4).map((section, index) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        • {section}
                      </li>
                    ))}
                    {template.structure.length > 4 && (
                      <li className="text-xs text-muted-foreground">
                        • and {template.structure.length - 4} more sections
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              {selectedTemplate?.id === template.id && (
                <div className="flex size-6 items-center justify-center rounded-full bg-primary">
                  <Check className="size-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <div className="flex justify-center">
          <Button onClick={onContinue} size="lg" className="min-w-[200px]">
            Continue with {selectedTemplate.name}
          </Button>
        </div>
      )}
    </div>
  )
}
