"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react"
import { Buffer } from "buffer"

interface AutoDiagramViewerProps {
  extractedText: string
  onSave: (diagramCode: string, diagramId: string) => void
  onContinue: () => void
}

export function AutoDiagramViewer({ extractedText, onSave, onContinue }: AutoDiagramViewerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [mermaidCode, setMermaidCode] = useState<string>("")
  const [diagramSvg, setDiagramSvg] = useState<string>("")
  const [error, setError] = useState("")
  const [diagramType, setDiagramType] = useState<"process" | "usecase">("process")
  const [isSaved, setIsSaved] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)

  useEffect(() => {
    generateDiagram("process")
  }, [])

  const generateDiagram = async (type: "process" | "usecase") => {
    setIsGenerating(true)
    setError("")
    setIsSaved(false)
    setUsedFallback(false)
    setDiagramType(type)

    try {
      const response = await fetch("/api/generate-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedText,
          diagramType: type,
        }),
      })

      const data = await response.json()

      if (!response.ok && !data.mermaidCode) {
        throw new Error(data.error || "Failed to generate diagram")
      }

      if (data.usedFallback) {
        setUsedFallback(true)
      }

      setMermaidCode(data.mermaidCode)

      try {
        const encodedDiagram = Buffer.from(data.mermaidCode).toString("base64")
        const svgUrl = `https://mermaid.ink/svg/${encodedDiagram}`

        const testResponse = await fetch(svgUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
        })

        if (testResponse.ok) {
          setDiagramSvg(svgUrl)
        } else {
          console.warn("[v0] Image preview unavailable, but diagram code is valid")
          setDiagramSvg("")
        }
      } catch (renderError) {
        console.warn("[v0] Image preview failed, continuing with code only:", renderError)
        setDiagramSvg("")
      }
    } catch (err) {
      console.error("[v0] Generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate diagram")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!mermaidCode) {
      setError("No diagram to save")
      return
    }

    try {
      const diagramId = `diagram_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const response = await fetch("/api/save-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagramId,
          diagramData: mermaidCode,
          diagramType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save diagram")
      }

      const data = await response.json()

      if (data.success) {
        setIsSaved(true)
        onSave(mermaidCode, diagramId)
      } else {
        throw new Error("Save operation failed")
      }
    } catch (err) {
      console.error("[v0] Failed to save diagram:", err)
      setError("Failed to save diagram. Please try again.")
    }
  }

  const handleRegenerate = () => {
    generateDiagram(diagramType)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Auto-Generated Process Map</h2>
        <p className="text-muted-foreground">AI has analyzed your document and created a visual process diagram</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <div className="mt-2 text-sm">
              Try clicking <strong>Regenerate</strong> or switch to a different diagram type.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {usedFallback && !error && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            Generated a basic diagram template. Try regenerating for a more detailed diagram based on your document.
          </AlertDescription>
        </Alert>
      )}

      {isSaved && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <AlertDescription className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Process map saved and will be included in your BRD
          </AlertDescription>
        </Alert>
      )}

      <Card className="glass-card border-border/50 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => generateDiagram("process")}
              disabled={isGenerating}
              variant={diagramType === "process" ? "default" : "outline"}
              size="sm"
            >
              Process Map
            </Button>
            <Button
              onClick={() => generateDiagram("usecase")}
              disabled={isGenerating}
              variant={diagramType === "usecase" ? "default" : "outline"}
              size="sm"
            >
              Use Case Diagram
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRegenerate} disabled={isGenerating} variant="outline" size="sm">
              <RefreshCw className={`mr-2 size-4 ${isGenerating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
            <Button onClick={handleSave} disabled={isGenerating || !mermaidCode || isSaved} size="sm">
              {isSaved ? (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Saved
                </>
              ) : (
                "Save Diagram"
              )}
            </Button>
          </div>
        </div>

        {isGenerating ? (
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 size-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analyzing document and generating enterprise-grade diagram...
              </p>
              <p className="mt-2 text-xs text-muted-foreground">This may take 10-20 seconds</p>
            </div>
          </div>
        ) : diagramSvg ? (
          <div className="overflow-auto rounded-lg border border-border bg-white p-8">
            <img
              src={diagramSvg || "/placeholder.svg"}
              alt="Generated Process Diagram"
              className="mx-auto max-w-full"
              onError={() => {
                console.warn("[v0] Image preview failed to load")
                setDiagramSvg("")
              }}
            />
          </div>
        ) : mermaidCode && !error ? (
          <div className="overflow-auto rounded-lg border border-border bg-muted/20 p-6">
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">Diagram generated successfully (preview unavailable)</p>
            </div>
            <pre className="overflow-auto rounded-lg bg-background p-4 text-xs">
              <code>{mermaidCode}</code>
            </pre>
          </div>
        ) : error ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 size-12 text-yellow-500" />
              <p className="text-muted-foreground">Click Regenerate to try again</p>
            </div>
          </div>
        ) : null}

        {mermaidCode && !isGenerating && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              View Mermaid Code
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-muted/30 p-4 text-xs">
              <code>{mermaidCode}</code>
            </pre>
          </details>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => onContinue()}>
          Skip Diagram
        </Button>
        <Button onClick={onContinue} size="lg" className="min-w-[200px]" disabled={!mermaidCode || !isSaved}>
          Continue to Generate BRD
        </Button>
      </div>
    </div>
  )
}
