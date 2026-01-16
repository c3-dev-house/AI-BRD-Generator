"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Shield, Lock, Trash2, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function PrivacyNotice() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Shield className="h-4 w-4 mr-2" />
        Privacy Policy
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Shield className="h-6 w-6 text-green-600" />
              Your Privacy is Protected
            </DialogTitle>
            <DialogDescription>How we handle your documents and data</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Key Commitment */}
            <Alert className="border-green-600 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-900 font-medium">
                We do NOT store, save, or retain your uploaded documents after processing
              </AlertDescription>
            </Alert>

            {/* What We Do */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                What We Do With Your Documents
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Extract text content for BRD generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Process content through OpenAI GPT-4.1 API</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Generate your Business Requirements Document</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>All data held in temporary memory only (RAM)</span>
                </li>
              </ul>
            </div>

            {/* What We Don't Do */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                What We DON'T Do
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>We do NOT store your uploaded documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>We do NOT save extracted text to databases</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>We do NOT use your documents for AI training</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>We do NOT share your content with third parties</span>
                </li>
              </ul>
            </div>

            {/* Data Lifecycle */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                When Is Your Data Deleted?
              </h3>
              <p className="text-sm text-muted-foreground">
                <strong>Our System:</strong> All your data is automatically deleted immediately after:
              </p>
              <ul className="space-y-1 text-sm pl-4">
                <li>• You download your BRD document, OR</li>
                <li>• You close your browser session, OR</li>
                <li>• 24 hours of inactivity</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">(whichever comes first)</p>
            </div>

            {/* Third-Party Services */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Third-Party Services & Data Retention:</h3>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="border rounded p-3 bg-blue-50">
                  <strong className="text-blue-900">OpenAI GPT-4.1 API:</strong>
                  <p className="mt-1 text-blue-800">
                    Generates BRD content from your extracted text. OpenAI retains API data for{" "}
                    <strong>up to 30 days</strong> for abuse monitoring, then automatically deletes it.
                  </p>
                  <p className="mt-1 text-blue-800">
                    ✓ Data is <strong>NOT used for AI training</strong> (per OpenAI API policy)
                  </p>
                  <p className="mt-1 text-blue-800">✓ Data remains confidential and is not shared</p>
                </div>
                <div className="border rounded p-2">
                  <strong>MongoDB Atlas (RAG - Optional):</strong> Stores only pre-approved template guidance documents.
                  Your uploaded documents are NEVER sent to MongoDB.
                </div>
                <div className="border rounded p-2">
                  <strong>Mermaid.ink:</strong> Renders process diagrams as PNG images. Only generic BPMN notation sent,
                  no sensitive data.
                </div>
              </div>
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Important:</strong> While we delete your data immediately, OpenAI's 30-day retention is
                  required for their abuse monitoring. Enterprise customers can request Zero Data Retention (ZDR) from
                  OpenAI for immediate deletion.
                </AlertDescription>
              </Alert>
            </div>

            {/* Security */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Security Measures:</h3>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>✓ All data transmitted via HTTPS/TLS 1.3 encryption</li>
                <li>✓ No persistent storage of your documents on our servers</li>
                <li>✓ No user accounts required (anonymous usage)</li>
                <li>✓ Compliant with GDPR, POPIA, and CCPA</li>
              </ul>
            </div>

            {/* Full Policy Link */}
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                For complete details, view our{" "}
                <a href="/PRIVACY_POLICY.md" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                  Full Privacy Policy
                </a>{" "}
                and{" "}
                <a
                  href="/TERMS_OF_SERVICE.md"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Terms of Service
                </a>
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsOpen(false)}>I Understand</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
