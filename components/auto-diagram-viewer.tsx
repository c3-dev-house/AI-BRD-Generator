"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react"
import { graphviz } from "d3-graphviz"

interface AutoDiagramViewerProps {
  extractedText: string
  onSave: (diagramCode: string, diagramId: string, image?: string) => void
  onContinue: () => void
}

export function AutoDiagramViewer({ extractedText, onSave, onContinue }: AutoDiagramViewerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [dotCode, setDotCode] = useState<string>("")
  const [error, setError] = useState("")
  const [diagramType, setDiagramType] = useState<"current-state" | "future-state">("current-state")
  const [isSaved, setIsSaved] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)
  const graphId = useRef(`graphviz-${Math.random().toString(36).substr(2, 9)}`).current

  useEffect(() => {
    generateDiagram("current-state")
  }, [])

  useEffect(() => {
    if (dotCode && !isGenerating) {
      renderDiagram(dotCode)
    }
  }, [dotCode, isGenerating])

  const renderDiagram = (code: string) => {
    try {
      setError("")
      setError("")
      const selection = graphviz(`#${graphId}`)

      selection
        .options({
          fit: true,
          height: 500,
          zoom: true,
        })
        .renderDot(code)
        .onerror((err: any) => {
          console.error("[v0] Graphviz render error:", err)
          setError(`Rendering Error: ${err}`)
        })
    } catch (err) {
      console.error("[v0] Graphviz render init error:", err)
      // Don't show technical error to user, just log it
      setError("Diagram rendering failed. The generated code might be invalid.")
    }
  }

  const generateDiagram = async (type: "current-state" | "future-state") => {
    setIsGenerating(true)
    setError("")
    setIsSaved(false)
    setUsedFallback(false)
    setDiagramType(type)
    setDotCode("")

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

      if (!data.success) {
        throw new Error(data.error || "Failed to generate diagram")
      }

      if (data.usedFallback) {
        setUsedFallback(true)
      }

      setDotCode(data.dotCode)
    } catch (err) {
      console.error("[v0] Generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate diagram")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    if (!dotCode) {
      setError("No diagram to save")
      return
    }

    try {
      const container = document.getElementById(graphId)
      const svgElement = container?.querySelector("svg")

      if (svgElement) {
        // Serialize SVG to string
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`

        // Convert to PNG using Canvas
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          // Use explicit dimensions or defaults
          const width = svgElement.clientWidth || 800
          const height = svgElement.clientHeight || 600
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          if (ctx) {
            // Set white background (PDFs/DOCX look better with non-transparent diagrams usually)
            ctx.fillStyle = "#FFFFFF"
            ctx.fillRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0, width, height)

            try {
              const pngData = canvas.toDataURL("image/png")
              // Pass PNG data
              onSave(dotCode, `${diagramType}-${Date.now()}`, pngData)
              setIsSaved(true)
              setTimeout(() => onContinue(), 1000)
            } catch (e) {
              console.error("[v0] Canvas export failed:", e)
              // Fallback to SVG or just code if canvas fails
              onSave(dotCode, `${diagramType}-${Date.now()}`, svgBase64)
              setIsSaved(true)
              setTimeout(() => onContinue(), 1000)
            }
          }
        }

        img.onerror = (e) => {
          console.error("[v0] Image load failed:", e)
          onSave(dotCode, `${diagramType}-${Date.now()}`) // Save without image
          setIsSaved(true)
          setTimeout(() => onContinue(), 1000)
        }

        img.src = svgBase64
      } else {
        // No SVG found
        onSave(dotCode, `${diagramType}-${Date.now()}`)
        setIsSaved(true)
        setTimeout(() => onContinue(), 1000)
      }
    } catch (err) {
      console.error("[v0] Failed to capture diagram SVG:", err)
      onSave(dotCode, `${diagramType}-${Date.now()}`)
      setIsSaved(true)
      setTimeout(() => onContinue(), 1000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {diagramType === "current-state" ? "Current State Process" : "Future State Process"}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateDiagram(diagramType === "current-state" ? "future-state" : "current-state")}
            disabled={isGenerating}
          >
            Switch to {diagramType === "current-state" ? "Future State" : "Current State"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => generateDiagram(diagramType)} disabled={isGenerating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {isGenerating ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating high-fidelity process map...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 size-12 text-yellow-500" />
              <p className="text-muted-foreground font-semibold">Rendering Failed</p>
              <p className="text-xs text-red-500 mt-2 max-w-[80%] mx-auto break-words">{error}</p>
              <p className="text-muted-foreground mt-4 text-sm">Click Regenerate to try again</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              id={graphId}
              className="min-h-[500px] w-full overflow-hidden rounded-md border bg-white p-4"
              style={{ textAlign: 'center' }}
            />

            {usedFallback && (
              <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Using fallback template due to generation complexity. Try regenerating for a custom flow.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Generated via Graphviz (DOT) Engine
              </div>
              <div className="flex gap-2">
                <Button onClick={onContinue} variant="outline">
                  Skip / Continue
                </Button>
                <Button onClick={handleSave} disabled={isSaved}>
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    "Save & Continue"
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">View DOT Source</summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 font-mono">
                  {dotCode}
                </pre>
              </details>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
