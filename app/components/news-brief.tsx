"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define types for the news article data structure
interface Article {
  title: string
  description: string
  url: string
  source: string
  category?: string
  language: string
  image?: string | null
  published_at: string
  topic?: string
}

// Define types for the API responses
interface NewsAPIResponse {
  articles?: Article[]
  error?: string
  code?: string
}

interface SummaryResponse {
  summary?: string
  error?: string
}

/**
 * NewsBrief Component
 * Fetches news articles and generates a summarized brief based on user preferences
 */
export function NewsBrief() {
  // State management for loading, summary content, errors, and debug information
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<any>(null)

  /**
   * Handles API error responses by attempting to parse JSON error messages
   * @param response - The Response object from the fetch call
   */
  const handleApiError = (error: any) => {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    setError(errorMessage);
  }

  /**
   * Generates a news brief by fetching articles and creating a summary
   * This function:
   * 1. Retrieves user preferences from localStorage
   * 2. Fetches news articles from the API
   * 3. Generates a summary based on the articles and preferences
   */
  const generateBrief = async () => {
    setLoading(true)
    setError(null)
    setSummary(null)
    setDebug(null)

    try {
      // Get user preferences from localStorage or use defaults
      const savedPreferences = localStorage.getItem("preferences")
      const preferences = savedPreferences
        ? JSON.parse(savedPreferences)
        : {
            tone: "casual",
            language: "english",
            readingTime: 5,
          }
      
      console.log("User preferences:", preferences)

      // Step 1: Fetch news articles from the API
      console.log("Fetching news articles...")
      const topicsParam = preferences.topics.join(',')
      const response = await fetch(`/api/news?topics=${topicsParam}`)

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      console.log("News API response:", {
        totalArticles: data.articles?.length,
        articles: data.articles?.map((article: Article) => ({
          title: article.title,
          description: article.description,
          url: article.url
        }))
      })

      // Validate news API response
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.articles?.length) {
        throw new Error("No news articles found")
      }

      // Step 2: Generate summary using the articles and user preferences
      console.log("Generating summary with payload:", {
        articles: data.articles.map((article: Article) => ({
          title: article.title,
          description: article.description,
          url: article.url
        })),
        preferences
      })
      
      const summaryResponse = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articles: data.articles,
          preferences,
        }),
      })

      if (!summaryResponse.ok) {
        await handleApiError(summaryResponse)
      }

      const summaryData: SummaryResponse = await summaryResponse.json()
      console.log("Summary API response:", {
        summaryLength: summaryData.summary?.length,
        summary: summaryData.summary
      })

      // Validate summary API response
      if (summaryData.error) {
        throw new Error(summaryData.error)
      }

      if (!summaryData.summary) {
        throw new Error("No summary was generated")
      }

      setSummary(summaryData.summary)
    } catch (error) {
      handleApiError(error)
    } finally {
      setLoading(false)
    }
  }

  function formatSummaryWithLinks(text: string) {
    // Parse references into a map
    const references = new Map(
      Array.from(text.matchAll(/\[(\d+)\]\s+(.+?)\s+\((https?:\/\/.+?)\)/g))
        .map(match => [match[1], { source: match[2], url: match[3] }])
    );

    // Replace reference markers with links
    const formattedText = text.replace(
      /\[(\d+)\]/g,
      (_, num) => {
        const ref = references.get(num);
        return ref ? `<a href="${ref.url}" target="_blank" class="text-primary hover:underline">[${ref.source}]</a>` : `[${num}]`;
      }
    );

    return formattedText;
  }

  // Render the news brief card with summary or error state
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Daily Brief</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display error message with debug information if there's an error */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {error}
              {debug && (
                <details className="mt-2 text-xs">
                  <summary>Debug Information</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}
        {/* Display either the generated summary or a prompt message */}
        {summary ? (
          <div 
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: formatSummaryWithLinks(summary) 
            }}
          />
        ) : (
          <p className="text-muted-foreground">Click generate to create your personalized news brief.</p>
        )}
      </CardContent>
      <CardFooter>
        {/* Generate button with loading state */}
        <Button onClick={generateBrief} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Brief"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

