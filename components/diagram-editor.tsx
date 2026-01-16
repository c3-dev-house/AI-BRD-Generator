'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, ImageIcon } from 'lucide-react'

interface DiagramEditorProps {
  onSave: (diagramData: string) => void
  onContinue: () => void
}

export function DiagramEditor({ onSave, onContinue }: DiagramEditorProps) {
  const [iframeSrc, setIframeSrc] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedDiagrams, setSavedDiagrams] = useState<string[]>([])
  const [error, setError] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Configure Draw.io embed with dark mode support
    const drawioUrl = 'https://embed.diagrams.net/'
    const params = new URLSearchParams({
      embed: '1',
      ui: 'min',
      spin: '1',
      proto: 'json',
      configure: '1'
    })
    setIframeSrc(`${drawioUrl}?${params.toString()}`)

    // Listen for messages from Draw.io iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data)
          
          if (message.event === 'init') {
            console.log(' Draw.io initialized')
          }
          
          if (message.event === 'save') {
            console.log(' Diagram saved from Draw.io')
            handleSaveDiagram(message.xml)
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleSaveDiagram = async (diagramXML: string) => {
    setIsSaving(true)
    setError('')

    try {
      // Convert XML to SVG for storage
      const diagramId = `diagram_${Date.now()}`
      
      const response = await fetch('/api/save-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagramId,
          diagramData: diagramXML,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save diagram')
      }

      setSavedDiagrams((prev) => [...prev, diagramId])
      onSave(diagramXML)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save diagram')
    } finally {
      setIsSaving(false)
    }
  }

  const requestSave = () => {
    // Send message to Draw.io iframe to export diagram
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ action: 'export', format: 'xmlsvg' }),
        '*'
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Create Process Diagrams</h2>
        <p className="text-muted-foreground">
          Design workflows, process flows, and system diagrams to include in your BRD
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {savedDiagrams.length > 0 && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <AlertDescription>
            {savedDiagrams.length} diagram{savedDiagrams.length !== 1 ? 's' : ''} saved successfully
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Diagram Editor</span>
          </div>
          <Button onClick={requestSave} disabled={isSaving} size="sm">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Diagram
              </>
            )}
          </Button>
        </div>
        
        <div className="relative" style={{ height: '600px' }}>
          {iframeSrc && (
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              className="size-full border-0"
              title="Draw.io Diagram Editor"
            />
          )}
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => onContinue()}>
          Skip Diagrams
        </Button>
        <Button onClick={onContinue} size="lg" className="min-w-[200px]">
          Continue to Generate BRD
        </Button>
      </div>
    </div>
  )
}
