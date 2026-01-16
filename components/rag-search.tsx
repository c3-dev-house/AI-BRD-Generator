'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Plus, X, Sparkles } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RAGResult {
  text: string
  similarity: number
  metadata: {
    source: string
    chunkIndex: number
  }
}

interface RAGSearchProps {
  onContinue: (selectedChunks: string[]) => void
}

export function RAGSearch({ onContinue }: RAGSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isGettingGuidance, setIsGettingGuidance] = useState(false)
  const [results, setResults] = useState<RAGResult[]>([])
  const [selectedChunks, setSelectedChunks] = useState<string[]>([])
  const [error, setError] = useState('')
  const [aiGuidance, setAiGuidance] = useState<string>('')

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError('')
    setAiGuidance('')

    try {
      const response = await fetch('/api/rag-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: searchQuery }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleGetGuidance = async () => {
    if (results.length === 0) return

    setIsGettingGuidance(true)
    setError('')

    try {
      const response = await fetch('/api/rag-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          results: results.slice(0, 5),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI guidance')
      }

      setAiGuidance(data.guidance)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get guidance')
    } finally {
      setIsGettingGuidance(false)
    }
  }

  const toggleChunk = (text: string) => {
    setSelectedChunks((prev) =>
      prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold text-foreground">Search Document Context</h2>
        <p className="text-lg text-muted-foreground">
          Search your document for specific context to include in the BRD generation
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <Card className="glass-card border-border/50 p-8 shadow-xl">
        <div className="mb-6 flex gap-3">
          <Input
            type="text"
            placeholder="Search for specific topics, requirements, or context..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="h-12 text-base"
          />
          <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} size="lg" className="min-w-[120px]">
            {isSearching ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Searching
              </>
            ) : (
              <>
                <Search className="mr-2 size-4" />
                Search
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-foreground">
                Found {results.length} relevant chunks • Selected: {selectedChunks.length}
              </p>
              <Button
                onClick={handleGetGuidance}
                disabled={isGettingGuidance}
                variant="outline"
                size="sm"
              >
                {isGettingGuidance ? (
                  <>
                    <Loader2 className="mr-2 size-3 animate-spin" />
                    Getting AI Guidance
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-3" />
                    Get AI Guidance
                  </>
                )}
              </Button>
            </div>

            {aiGuidance && (
              <Alert className="mb-6 border-primary/50 bg-primary/10">
                <Sparkles className="size-4 text-primary" />
                <AlertDescription className="mt-2 text-sm text-foreground">
                  <strong className="block mb-2 text-primary">AI Guidance:</strong>
                  {aiGuidance}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {results.map((result, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer p-5 transition-all hover:border-primary hover:shadow-md ${
                    selectedChunks.includes(result.text)
                      ? 'border-2 border-primary bg-primary/10 shadow-md'
                      : 'border border-border/50 bg-card/50'
                  }`}
                  onClick={() => toggleChunk(result.text)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-foreground/90">{result.text}</p>
                      <div className="mt-3 flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          Relevance: <strong className="text-primary">{(result.similarity * 100).toFixed(1)}%</strong>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Chunk {result.metadata.chunkIndex + 1}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedChunks.includes(result.text) ? 'default' : 'outline'}
                      className="shrink-0"
                    >
                      {selectedChunks.includes(result.text) ? (
                        <X className="size-4" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && !isSearching && (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-4 size-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Enter a search query to find relevant context from your document
            </p>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => onContinue([])} size="lg" className="min-w-[160px]">
          Skip RAG Search
        </Button>
        <Button
          onClick={() => onContinue(selectedChunks)}
          disabled={selectedChunks.length === 0}
          size="lg"
          className="min-w-[240px] shadow-lg shadow-primary/20"
        >
          Continue with {selectedChunks.length} Context{selectedChunks.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  )
}
