"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Upload,
  FileText,
  Download,
  Loader2,
  Sparkles,
  Mail,
  FileType,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"
import { PrivacyNotice } from "@/components/privacy-notice"

import type { BRDTemplate } from "@/lib/brd-templates"
import { TemplateSelector } from "@/components/template-selector"
import { RAGSearch } from "@/components/rag-search"
import { AutoDiagramViewer } from "@/components/auto-diagram-viewer"
import Image from "next/image"
import { MissingInfoDialog } from "@/components/missing-info-dialog"

type Step = "upload" | "template" | "rag" | "diagram" | "analyze" | "generate" | "complete"

type SavedDiagram = {
  id: string
  code: string
  type: string
  saved: boolean
  encodedImage?: string // Base64 image data (SVG or PNG)
  imageUrl?: string // Legacy URL support
}

export default function BRDGenerator() {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isEmbedding, setIsEmbedding] = useState(false)
  const [extractedText, setExtractedText] = useState<string>("")
  const [brdContent, setBrdContent] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [step, setStep] = useState<Step>("upload")
  const [userEmail, setUserEmail] = useState<string>("")
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [showMissingInfo, setShowMissingInfo] = useState(false)
  const [missingInfoData, setMissingInfoData] = useState<any>(null)
  const [additionalInfo, setAdditionalInfo] = useState<Record<string, string>>({})

  const [templates, setTemplates] = useState<BRDTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<BRDTemplate | null>(null)
  const [ragContext, setRagContext] = useState<string[]>([])
  const [diagrams, setDiagrams] = useState<SavedDiagram[]>([])
  const [processDiagram, setProcessDiagram] = useState<string>("")

  // State for privacy modal
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/templates")
      const data = await response.json()
      setTemplates(data.templates)
      // Set Convergenc3 as default
      const defaultTemplate = data.templates.find((t: BRDTemplate) => t.id === "convergenc3")
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate)
      }
    } catch (err) {
      console.error("[v0] Failed to load templates:", err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 5) {
      setError("Maximum 5 files allowed")
      return
    }
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles)
      setError("")
      setSuccessMessage("")
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 5) {
      setError("Maximum 5 files allowed")
      return
    }
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles)
      setError("")
      setSuccessMessage("")
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file")
      return
    }

    setIsUploading(true)
    setError("")
    setSuccessMessage("")

    try {
      console.log("[v0] Starting file upload for", files.length, "file(s)")

      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`file${index}`, file)
      })

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("[v0] Upload response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      if (!data.extractedText || data.extractedText.trim().length === 0) {
        console.error("[v0] No content extracted from files")
        throw new Error(
          "No content could be extracted from the uploaded files. Please ensure your files contain readable text.",
        )
      }

      console.log("[v0] Extracted text length:", data.extractedText.length)
      console.log("[v0] Extracted text preview:", data.extractedText.substring(0, 200))

      setExtractedText(data.extractedText)
      setSuccessMessage(`Successfully processed ${data.fileCount} file${data.fileCount > 1 ? "s" : ""}!`)

      // Show privacy modal after successful upload
      console.log("[v0] Showing privacy policy modal...")
      setShowPrivacyModal(true)

    } catch (err) {
      console.error("[v0] Upload error:", err)
      setError(err instanceof Error ? err.message : "An error occurred during upload")
    } finally {
      setIsUploading(false)
      console.log("[v0] Upload process completed")
    }
  }

  // Handle privacy acceptance
  const handlePrivacyAccept = () => {
    console.log("[v0] Privacy policy accepted, proceeding to template step")
    setPrivacyAccepted(true)
    setShowPrivacyModal(false)
    setStep("template")
  }

  const generateProcessDiagrams = async (text: string) => {
    try {
      console.log("[v0] Auto-generating process diagrams...")

      // Generate Current State diagram
      const currentStateResponse = await fetch("/api/generate-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedText: text,
          diagramType: "current-state",
        }),
      })

      const currentStateData = await currentStateResponse.json()

      if (currentStateData.success) {
        const currentStateDiagram: SavedDiagram = {
          id: "current-state-diagram",
          code: currentStateData.dotCode, // Updated to use DOT code
          type: "Current State Process",
          saved: true, // Marked as saved so it's included in BRD
        }

        // Generate Future State diagram
        const futureStateResponse = await fetch("/api/generate-diagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            extractedText:
              text + "\n\nGenerate a FUTURE STATE diagram showing the improved, automated process with AI integration.",
            diagramType: "future-state", // Updated type for clarity
          }),
        })

        const futureStateData = await futureStateResponse.json()

        if (futureStateData.success) {
          const futureStateDiagram: SavedDiagram = {
            id: "future-state-diagram",
            code: futureStateData.dotCode, // Updated to use DOT code
            type: "Future State Process",
            saved: true, // Marked as saved so it's included in BRD
          }

          setDiagrams([currentStateDiagram, futureStateDiagram])
          console.log("[v0] Process diagrams generated and saved")
        }
      }
    } catch (err) {
      console.error("[v0] Failed to auto-generate diagrams:", err)
      // Don't block the flow if diagram generation fails
    }
  }

  const handleTemplateContinue = () => {
    if (!selectedTemplate) {
      setError("Please select a template")
      return
    }
    setStep("rag")
  }

  const handleRAGContinue = (selectedChunks: string[]) => {
    setRagContext(selectedChunks)
    setStep("diagram")

    // Auto-generate diagrams when moving to diagram step
    if (extractedText) {
      setTimeout(() => {
        generateProcessDiagrams(extractedText).catch((err) => {
          console.error("[v0] Diagram generation failed:", err)
        })
      }, 100)
    }
  }

  const handleDiagramContinue = () => {
    setStep("analyze")
  }

  const handleProcessDiagramSave = (diagramCode: string, diagramId: string, encodedImage?: string) => {
    console.log("[v0] Diagram saved with ID:", diagramId)
    if (encodedImage) {
      console.log("[v0] Received encoded image length:", encodedImage.length)
    }

    setProcessDiagram(diagramCode)
    setDiagrams((prev) => [
      ...prev,
      {
        id: diagramId,
        code: diagramCode,
        type: "process",
        saved: true,
        encodedImage,
      },
    ])
    setSuccessMessage("Process map saved successfully!")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleAnalyzeAndValidate = async () => {
    try {
      setError("")

      // Build comprehensive context for validation
      const validationContext = {
        extractedText,
        templateId: selectedTemplate?.id || "convergenc3",
        ragContext: ragContext.join("\n\n"), // Include RAG selections
        hasDiagrams: diagrams.length > 0,
        diagramCount: diagrams.length,
        additionalInfo, // Include any previously provided info
      }

      console.log("[v0] Validating with context:", {
        templateId: validationContext.templateId,
        ragChunks: ragContext.length,
        diagrams: diagrams.length,
        hasAdditionalInfo: Object.keys(additionalInfo).length > 0,
      })

      const response = await fetch("/api/validate-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationContext),
      })

      const validation = await response.json()

      if (!response.ok) {
        throw new Error(validation.error || "Validation failed")
      }

      if (validation.missingItems && validation.missingItems.length > 0) {
        const hasCritical = validation.missingItems.some((item: any) => item.importance === "critical")

        if (hasCritical || validation.completenessScore < 60) {
          setMissingInfoData(validation)
          setShowMissingInfo(true)
        } else {
          // Minor issues, proceed with generation
          handleGenerateBRD()
        }
      } else {
        handleGenerateBRD()
      }
    } catch (err) {
      console.error("[v0] Validation error:", err)
      // Still proceed even if validation fails
      handleGenerateBRD()
    }
  }

  const handleProceedWithInfo = (answers: Record<string, string>) => {
    console.log("[v0] Proceeding with answers:", {
      answersProvided: Object.keys(answers).length,
      answers,
    })

    setAdditionalInfo({ ...additionalInfo, ...answers })
    setShowMissingInfo(false)

    setTimeout(() => {
      handleGenerateBRD(answers)
    }, 100)
  }

  const handleGenerateBRD = async (answers: Record<string, string> = {}) => {
    setIsGenerating(true)
    setError("")
    setSuccessMessage("")
    setStep("generate")

    try {
      if (!extractedText || extractedText.trim() === "") {
        throw new Error("No document content available. Please upload a document first.")
      }

      const savedDiagramCodes = diagrams.filter((d) => d.saved).map((d) => d.code)

      console.log("[v0] Generating BRD with:", {
        extractedTextLength: extractedText.length,
        template: selectedTemplate?.id,
        ragChunks: ragContext.length,
        savedDiagrams: savedDiagramCodes.length,
        totalDiagrams: diagrams.length,
        additionalInfoFields: Object.keys(answers).length,
      })

      const response = await fetch("/api/generate-brd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedText,
          templateId: selectedTemplate?.id || "convergenc3",
          ragContext,
          diagrams: savedDiagramCodes, // Only saved diagrams
          additionalInfo: { ...additionalInfo, ...answers },
          missingInfo: missingInfoData?.missingItems || [],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "BRD generation failed")
      }

      setBrdContent(data.brd)
      setStep("complete")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate BRD")
      setStep("analyze")
    } finally {
      setIsGenerating(false)
    }
  }

  /*
  const handleDownloadPDF = async () => {
    try {
      console.log("[v0] Download PDF clicked")
      console.log("[v0] BRD Content length:", brdContent?.length || 0)
      console.log("[v0] BRD Content preview:", brdContent?.substring(0, 200) || "EMPTY")
      console.log("[v0] Diagrams count:", diagrams.length)

      setError("")
      setSuccessMessage("")

      if (!brdContent || brdContent.trim() === "") {
        setError("No BRD content available. Please generate the BRD first.")
        console.error("[v0] Download attempted without BRD content")
        return
      }

      const diagramCodes = diagrams.filter((d) => d.code && d.code.trim() !== "").map((d) => d.code)
      const unsavedCount = diagrams.filter((d) => !d.saved).length

      if (unsavedCount > 0) {
        console.warn(
          `[v0] ${unsavedCount} diagram(s) not saved, but proceeding with ${diagramCodes.length} available diagrams`,
        )
      }

      console.log("[v0] Sending PDF download request with", diagramCodes.length, "diagrams")
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brdContent,
          diagrams: diagramCodes,
        }),
      })

      console.log("[v0] PDF download response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] PDF download failed:", errorData)
        throw new Error(errorData.error || "PDF download failed")
      }

      const blob = await response.blob()
      console.log("[v0] PDF blob size:", blob.size)

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `BRD_${files.map((file) => file.name.split(".")[0]).join("_")}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccessMessage("PDF downloaded successfully!")
      console.log("[v0] PDF download completed")
    } catch (err) {
      console.error("[v0] PDF download error:", err)
      setError(err instanceof Error ? err.message : "Failed to download PDF")
    }
  }
  */

  const handleDownloadDOCX = async () => {
    try {
      console.log("[v0] Download DOCX clicked")
      console.log("[v0] BRD Content length:", brdContent?.length || 0)
      console.log("[v0] BRD Content preview:", brdContent?.substring(0, 200) || "EMPTY")
      console.log("[v0] Diagrams count:", diagrams.length)

      setError("")
      setSuccessMessage("")

      if (!brdContent || brdContent.trim() === "") {
        setError("No BRD content available. Please generate the BRD first.")
        console.error("[v0] Download attempted without BRD content")
        return
      }

      const savedDiagrams = diagrams.filter((d) => d.saved)
      const unsavedCount = diagrams.filter((d) => !d.saved).length

      if (unsavedCount > 0) {
        console.warn(
          `[v0] ${unsavedCount} diagram(s) not saved, but proceeding with ${savedDiagrams.length} available diagrams`,
        )
      }

      console.log("[v0] Sending DOCX download request with", savedDiagrams.length, "diagrams")
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brdContent,
          diagrams: savedDiagrams, // Send full objects including encodedImage
        }),
      })

      console.log("[v0] DOCX download response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] DOCX download failed:", errorData)
        throw new Error(errorData.error || "DOCX download failed")
      }

      const blob = await response.blob()
      console.log("[v0] DOCX blob size:", blob.size)

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `BRD_${files.map((file) => file.name).join("_")}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccessMessage("DOCX downloaded successfully!")
      console.log("[v0] DOCX download completed")
    } catch (err) {
      console.error("[v0] DOCX download error:", err)
      setError(err instanceof Error ? err.message : "Failed to download DOCX")
    }
  }

  const handleSendEmail = async () => {
    if (!userEmail) {
      setError("Please enter your email address")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      setError("Please enter a valid email address")
      return
    }

    setIsSendingEmail(true)
    setError("")
    setSuccessMessage("")

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          brdContent,
          fileName: files.map((file) => file.name).join("_"),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email")
      }

      setSuccessMessage(`BRD sent successfully to ${userEmail}!`)
      setShowEmailInput(false)
      setUserEmail("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email")
    } finally {
      setIsSendingEmail(false)
    }
  }

  const resetForm = () => {
    setFiles([])
    setExtractedText("")
    setBrdContent("")
    setError("")
    setSuccessMessage("")
    setStep("upload")
    setUserEmail("")
    setShowEmailInput(false)
    setSelectedTemplate(templates.find((t) => t.id === "convergenc3") || null)
    setRagContext([])
    setDiagrams([])
    setProcessDiagram("")
    setShowMissingInfo(false)
    setMissingInfoData(null)
    setAdditionalInfo({})
    setPrivacyAccepted(false)
    setShowPrivacyModal(false)
  }

  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Upload" },
    { id: "template", label: "Template" },
    { id: "rag", label: "Search" },
    { id: "diagram", label: "Diagrams" },
    { id: "analyze", label: "Review" },
    { id: "generate", label: "Generate" },
    { id: "complete", label: "Complete" },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)

  return (
    <div className="min-h-screen bg-background">
      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-8 overflow-y-auto max-h-[80vh]">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Privacy Notice</h2>
                <p className="text-muted-foreground">Please review our privacy policy before continuing</p>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h3>Data Processing & Privacy</h3>
                <p>
                  Your uploaded documents are processed securely and are not permanently stored on our servers. We use
                  advanced AI models to analyze and generate Business Requirements Documents from your content.
                </p>

                <h3>What We Collect</h3>
                <ul>
                  <li>Document content for processing</li>
                  <li>File metadata (names, sizes, types)</li>
                  <li>Template selections and user preferences</li>
                  <li>Generated diagrams and BRD content</li>
                </ul>

                <h3>How We Use Your Data</h3>
                <ul>
                  <li>Process documents to extract text and analyze requirements</li>
                  <li>Generate Business Requirements Documents</li>
                  <li>Create process diagrams and visualizations</li>
                  <li>Improve our AI models (anonymized data only)</li>
                </ul>

                <h3>Data Retention</h3>
                <p>
                  Your documents are processed in real-time and deleted from our servers within 24 hours. Generated BRDs
                  and diagrams are available for download but are not stored indefinitely.
                </p>

                <h3>Security Measures</h3>
                <ul>
                  <li>End-to-end encryption for document uploads</li>
                  <li>Secure server infrastructure with regular audits</li>
                  <li>No sharing of your data with third parties</li>
                  <li>Compliance with data protection regulations</li>
                </ul>

                <div className="bg-muted/30 rounded-lg p-4 mt-6 border border-border/50">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      By clicking "I Understand & Continue", you acknowledge that you have read and agree to our
                      privacy policy and terms of service.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border bg-card/50 p-6 flex justify-center">
              <Button
                onClick={handlePrivacyAccept}
                size="lg"
                className="min-w-[240px] h-14 text-base font-semibold shadow-lg shadow-primary/30"
              >
                <CheckCircle2 className="mr-2 size-5" />
                I Understand & Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl relative">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="flex items-center justify-between relative">
            {/* Logo on the left */}
            <div className="flex items-center z-10">
              <Image
                src="/logo.png"
                alt="Convergenc3"
                width={95}
                height={32}
                className="h-auto object-contain"
                priority
              />
            </div>

            {/* Beautifully styled centered title */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                  BRD Generator System
                </h1>
                <p className="text-xs text-muted-foreground mt-1 tracking-wide font-medium">
                  AI-Powered Business Requirements Documentation
                </p>
              </div>
            </div>

            {/* Theme toggle and Privacy Notice on the right */}
            <div className="flex items-center gap-4 z-10">
              <PrivacyNotice />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-16">
        <div className="mb-16 flex items-center justify-center gap-1">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex size-12 items-center justify-center rounded-xl font-bold transition-all duration-300 ${currentStepIndex === index
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                    : currentStepIndex > index
                      ? "bg-primary/20 text-primary border-2 border-primary/50"
                      : "bg-muted/50 text-muted-foreground border-2 border-border"
                    }`}
                >
                  {currentStepIndex > index ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${currentStepIndex === index ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-3 h-0.5 w-16 transition-all duration-300 ${currentStepIndex > index ? "bg-primary" : "bg-border"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-8 border-primary/50 bg-primary/10">
            <AlertDescription className="text-sm text-foreground">{successMessage}</AlertDescription>
          </Alert>
        )}

        {step === "upload" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="mb-3 text-4xl font-bold tracking-tight text-foreground">
                Transform Documents into <span className="text-primary">Enterprise BRDs</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Upload your requirements documents and let AI generate comprehensive Business Requirements Documentation
              </p>
            </div>

            <Card className="glass-card border-border/50 p-12 shadow-2xl">
              <label
                htmlFor="file-upload"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="group flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 p-16 transition-all duration-300 hover:border-primary/50 hover:bg-muted/30"
              >
                <div className="mb-6 rounded-full bg-primary/10 p-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                  <Upload className="size-12 text-primary" />
                </div>
                {files.length > 0 ? (
                  <div className="text-center">
                    <p className="mb-3 text-2xl font-bold text-foreground">
                      {files.length} file{files.length > 1 ? "s" : ""} selected
                    </p>
                    <div className="mb-3 space-y-1">
                      {files.map((file, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      ))}
                    </div>
                    <p className="text-muted-foreground">Ready to process</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-3 text-2xl font-semibold text-foreground">Drop your documents here</p>
                    <p className="mb-6 text-muted-foreground">or click to browse your files (1-5 documents)</p>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                      <FileText className="size-4" />
                      <span>PDF, DOCX, TXT, PPTX, MD, CSV, JSON, XLSX</span>
                    </div>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  className="sr-only"
                  accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.xlsx,.xls,.pptx,.ppt"
                  multiple
                  max={5}
                />
              </label>

              {files.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || isEmbedding}
                    size="lg"
                    className="min-w-[240px] h-14 text-base font-semibold shadow-lg shadow-primary/30"
                  >
                    {isUploading || isEmbedding ? (
                      <>
                        <Loader2 className="mr-2 size-5 animate-spin" />
                        {isEmbedding ? "Embedding..." : "Processing..."}
                      </>
                    ) : (
                      <>
                        Process Document
                        <ArrowRight className="ml-2 size-5" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: Sparkles, title: "AI-Powered Analysis", desc: "Advanced GPT-4 document understanding" },
                { icon: TrendingUp, title: "Enterprise Templates", desc: "Industry-standard BRD formats" },
                { icon: CheckCircle2, title: "Instant Generation", desc: "Professional documents in minutes" },
              ].map((feature, i) => (
                <Card key={i} className="glass-card border-border/50 p-6 text-center">
                  <div className="mb-3 inline-flex rounded-full bg-primary/10 p-3">
                    <feature.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === "template" && templates.length > 0 && (
          <TemplateSelector
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={setSelectedTemplate}
            onContinue={handleTemplateContinue}
          />
        )}

        {step === "rag" && <RAGSearch onContinue={handleRAGContinue} />}

        {step === "diagram" && (
          <AutoDiagramViewer
            extractedText={extractedText}
            onSave={handleProcessDiagramSave}
            onContinue={handleDiagramContinue}
          />
        )}

        {step === "analyze" && extractedText && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">Review & Confirm</h2>
              <p className="text-muted-foreground">Verify your document analysis before generating the BRD</p>
            </div>

            <Card className="glass-card border-border/50 p-10 shadow-2xl">
              <div className="mb-8 grid gap-6 md:grid-cols-3">
                <div className="rounded-xl bg-muted/30 p-6 text-center">
                  <p className="mb-2 text-sm text-muted-foreground">Template</p>
                  <p className="text-xl font-bold text-foreground">{selectedTemplate?.name}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-6 text-center">
                  <p className="mb-2 text-sm text-muted-foreground">Context Chunks</p>
                  <p className="text-xl font-bold text-primary">{ragContext.length}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-6 text-center">
                  <p className="mb-2 text-sm text-muted-foreground">Saved Diagrams</p>
                  <p className="text-xl font-bold text-primary">{diagrams.filter((d) => d.saved).length}</p>
                </div>
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm text-muted-foreground">Documents Uploaded</p>
                  <p className="text-2xl font-bold text-primary">{files.length}</p>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm text-muted-foreground">Characters Extracted</p>
                  <p className="text-2xl font-bold text-primary">{extractedText.length.toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-8 rounded-xl border border-border/50 bg-muted/10 p-8">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Extracted Document Content
                </h3>
                <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border/30 bg-background/50 p-4">
                  <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
                    {extractedText.substring(0, 1000)}
                  </p>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  This content will be used to generate your Business Requirements Document
                </p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <Button onClick={resetForm} variant="outline" size="lg" className="min-w-[160px] bg-transparent">
                  Start Over
                </Button>
                <Button
                  onClick={handleAnalyzeAndValidate}
                  disabled={isGenerating}
                  size="lg"
                  className="min-w-[240px] h-14 text-base font-semibold shadow-lg shadow-primary/30"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 size-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-5" />
                      Generate Enterprise BRD
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {step === "generate" && (
          <Card className="glass-card border-border/50 p-16 text-center shadow-2xl">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <Loader2 className="relative size-20 animate-spin text-primary" />
              </div>
              <div>
                <h2 className="mb-3 text-3xl font-bold text-foreground">Generating Your BRD</h2>
                <p className="text-lg text-muted-foreground">
                  AI is crafting a comprehensive Business Requirements Document
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="size-2 animate-pulse rounded-full bg-primary" />
                <span>This may take 30-60 seconds</span>
              </div>
            </div>
          </Card>
        )}

        {step === "complete" && brdContent && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4">
                <CheckCircle2 className="size-12 text-primary" />
              </div>
              <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">BRD Generated Successfully</h2>
              <p className="text-lg text-muted-foreground">
                Your enterprise-grade Business Requirements Document is ready
              </p>
            </div>

            <Card className="glass-card border-border/50 p-10 shadow-2xl">
              <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
                {/* <Button onClick={handleDownloadPDF} size="lg" className="min-w-[180px] shadow-lg shadow-primary/20">
                  <FileType className="mr-2 size-5" />
                  Download PDF
                </Button> */}

                <Button onClick={handleDownloadDOCX} size="lg" className="min-w-[180px] shadow-lg shadow-primary/20">
                  <Download className="mr-2 size-5" />
                  Download DOCX
                </Button>

                <Button
                  onClick={() => setShowEmailInput(!showEmailInput)}
                  size="lg"
                  variant="outline"
                  className="min-w-[180px]"
                >
                  <Mail className="mr-2 size-5" />
                  Send via Email
                </Button>
              </div>

              {showEmailInput && (
                <div className="mb-8 rounded-xl border border-border/50 bg-muted/10 p-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Label htmlFor="email" className="mb-3 block text-sm font-semibold">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@company.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <Button onClick={handleSendEmail} disabled={isSendingEmail} size="lg" className="min-w-[140px]">
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 size-4" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border/50 bg-muted/10">
                <div className="border-b border-border/50 bg-card/50 px-8 py-4">
                  <h3 className="font-semibold text-foreground">Document Preview</h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto p-8">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {brdContent.split("\n").map((line, index) => {
                      if (line.startsWith("# ")) {
                        return (
                          <h1 key={index} className="mb-6 mt-8 text-4xl font-bold tracking-tight">
                            {line.substring(2)}
                          </h1>
                        )
                      }
                      if (line.startsWith("## ")) {
                        return (
                          <h2 key={index} className="mb-4 mt-6 text-2xl font-semibold tracking-tight">
                            {line.substring(3)}
                          </h2>
                        )
                      }
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={index} className="mb-3 mt-5 text-xl font-semibold">
                            {line.substring(4)}
                          </h3>
                        )
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <li key={index} className="ml-6">
                            {line.substring(2)}
                          </li>
                        )
                      }
                      if (line.trim() === "") {
                        return <br key={index} />
                      }
                      return (
                        <p key={index} className="mb-3 leading-relaxed">
                          {line}
                        </p>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Button onClick={resetForm} variant="outline" size="lg" className="min-w-[200px] bg-transparent">
                  Restart
                </Button>
              </div>
            </Card>
          </div>
        )}

        <MissingInfoDialog
          isOpen={showMissingInfo}
          missingItems={missingInfoData?.missingItems || []}
          completenessScore={missingInfoData?.completenessScore || 0}
          onProceed={handleProceedWithInfo}
          onCancel={() => setShowMissingInfo(false)}
        />
      </main>
    </div>
  )
}