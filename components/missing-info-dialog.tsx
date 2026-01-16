"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle, CheckCircle2, ArrowRight, X } from "lucide-react"

interface MissingItem {
  category: string
  question: string
  importance: "critical" | "high" | "medium"
  suggestedPrompt: string
}

interface MissingInfoDialogProps {
  isOpen: boolean // Added isOpen prop to control visibility
  missingItems: MissingItem[]
  completenessScore: number
  onProceed: (additionalInfo: Record<string, string>) => void
  onCancel: () => void
}

export function MissingInfoDialog({
  isOpen,
  missingItems,
  completenessScore,
  onProceed,
  onCancel,
}: MissingInfoDialogProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [skipWarning, setSkipWarning] = useState(false)

  if (!isOpen || !missingItems || missingItems.length === 0) {
    return null
  }

  const criticalMissing = missingItems.filter((item) => item.importance === "critical")
  const highMissing = missingItems.filter((item) => item.importance === "high")

  const handleProceed = () => {
    console.log("[v0] MissingInfoDialog handleProceed called:", {
      criticalMissing: criticalMissing.length,
      answersProvided: Object.keys(answers).length,
      skipWarning,
    })

    if (criticalMissing.length > 0 && Object.keys(answers).length === 0 && !skipWarning) {
      setSkipWarning(true)
      return
    }

    console.log("[v0] Calling onProceed with answers")
    onProceed(answers)
  }

  const handleSkipAnyway = () => {
    console.log("[v0] User chose to skip critical warnings and proceed anyway")
    onProceed({})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="glass-card max-h-[90vh] w-full max-w-4xl overflow-y-auto border-border/50 p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <AlertTriangle className="size-8 text-amber-500" />
              <h2 className="text-2xl font-bold text-foreground">Missing Information Detected</h2>
            </div>
            <p className="text-muted-foreground">
              Your document is <strong className="text-foreground">{completenessScore}% complete</strong>. Please
              provide additional information for a more comprehensive BRD.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="mb-6 space-y-6">
          {missingItems.map((item, index) => (
            <div key={index} className="rounded-xl border border-border/50 bg-muted/10 p-6">
              <div className="mb-3 flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.importance === "critical"
                      ? "bg-destructive/20 text-destructive"
                      : item.importance === "high"
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-primary/20 text-primary"
                  }`}
                >
                  {item.importance.toUpperCase()}
                </span>
                <h3 className="font-semibold text-foreground">{item.category}</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{item.question}</p>
              <div>
                <Label htmlFor={`answer-${index}`} className="mb-2 block text-sm text-foreground">
                  {item.suggestedPrompt}
                </Label>
                <Textarea
                  id={`answer-${index}`}
                  placeholder="Enter your response here..."
                  value={answers[item.category] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [item.category]: e.target.value }))}
                  className="min-h-[100px] bg-background"
                />
              </div>
            </div>
          ))}
        </div>

        {skipWarning && (
          <div className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-6">
            <div className="mb-3 flex items-center gap-3">
              <AlertTriangle className="size-6 text-destructive" />
              <h3 className="font-semibold text-destructive">Warning: Critical Information Missing</h3>
            </div>
            <p className="mb-4 text-sm text-foreground/90">
              You have {criticalMissing.length} critical item(s) missing. The generated BRD will include placeholders
              and notes indicating missing information. This may reduce document quality and completeness for
              stakeholder review.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setSkipWarning(false)} variant="outline">
                Go Back and Fill Information
              </Button>
              <Button onClick={handleSkipAnyway} variant="destructive">
                Proceed Anyway
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Button onClick={onCancel} variant="outline" size="lg">
            Cancel
          </Button>
          <Button onClick={handleProceed} size="lg" className="min-w-[200px]">
            {Object.keys(answers).length > 0 ? (
              <>
                <CheckCircle2 className="mr-2 size-5" />
                Generate with Answers
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 size-5" />
                Generate Without Answers
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
