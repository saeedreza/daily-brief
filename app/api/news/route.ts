import { NextResponse } from "next/server"

// Define source mappings based on political views
const POLITICAL_SOURCES = {
  left: ["huffpost", "msnbc", "the-washington-post"],
  "center-left": ["cnn", "nbc-news", "time"],
  neutral: ["reuters", "associated-press", "bloomberg"],
  "center-right": ["the-wall-street-journal", "the-hill"],
  right: ["fox-news", "national-review"],
}

interface NewsArticle {
  title: string
  description: string
  url: string
  source: {
    id: string
    name: string
  }
  topic?: string // Add topic for tracking
}

/**
 * Fetches articles for a specific topic from given sources
 */
async function fetchTopicArticles(
  topic: string, 
  sources: string[], 
  apiKey: string
): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = []

  // Fetch from each source individually to ensure balanced coverage
  for (const source of sources) {
    const queryParams = new URLSearchParams({
      sources: source,
      language: "en",
      pageSize: "5", // Limit articles per source
      sortBy: "publishedAt",
      apiKey,
    })

    // Add topic-specific search terms
    const topicQuery = (() => {
      switch (topic) {
        case "business":
          return "(business OR economy OR finance OR market)"
        case "technology":
          return "(technology OR tech OR software OR AI OR digital)"
        case "entertainment":
          return "(entertainment OR movie OR music OR celebrity)"
        case "health":
          return "(health OR medical OR healthcare OR wellness)"
        case "science":
          return "(science OR research OR discovery OR space)"
        case "sports":
          return "(sports OR athletics OR game OR tournament)"
        default:
          return topic
      }
    })()
    
    queryParams.append("q", topicQuery)

    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?${queryParams.toString()}`
      )

      if (!response.ok) {
        console.error(`Error fetching from ${source}:`, await response.json())
        continue // Skip this source if there's an error
      }

      const data = await response.json()
      const validArticles = (data.articles || [])
        .filter((article: any) => article.title && article.description)
        .map((article: any) => ({
          ...article,
          topic // Add topic to each article
        }))

      articles.push(...validArticles)
    } catch (error) {
      console.error(`Error fetching from ${source}:`, error)
      continue // Skip this source on error
    }
  }

  return articles
}

/**
 * GET endpoint to fetch top US news headlines from NewsAPI
 * Requires NEWS_API_KEY environment variable to be configured
 * @returns NextResponse containing either articles or error message
 */
export async function GET(request: Request) {
  // Verify API key first
  if (!process.env.NEWS_API_KEY) {
    return NextResponse.json({ error: "NEWS_API_KEY is not configured" }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const topics = searchParams.get("topics")?.split(",") || ["general"]
    const politicalView = searchParams.get("politicalView") || "neutral"
    const useCustomSources = searchParams.get("useCustomSources") === "true"
    const customSources = searchParams.get("customSources")?.split(",") || []

    // Add error handling for sources
    const sources = useCustomSources
      ? customSources
      : POLITICAL_SOURCES[politicalView as keyof typeof POLITICAL_SOURCES]

    // Add validation for sources
    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: "No valid news sources configured" }, { status: 400 })
    }

    console.log("API Key configured:", !!process.env.NEWS_API_KEY)
    console.log("Political View:", politicalView)
    console.log("Sources available:", !!sources)

    let allArticles: NewsArticle[] = []

    // If general is selected, fetch recent news without topic filtering
    if (topics.includes("general")) {
      const queryParams = new URLSearchParams({
        sources: sources.join(","),
        language: "en",
        pageSize: "10",
        sortBy: "publishedAt",
        apiKey: process.env.NEWS_API_KEY,
      })

      const response = await fetch(
        `https://newsapi.org/v2/everything?${queryParams.toString()}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch general news")
      }

      const data = await response.json()
      allArticles = data.articles
        .filter((article: any) => article.title && article.description)
        .map((article: any) => ({
          ...article,
          topic: "general"
        }))
    } else {
      // Fetch articles for each topic
      for (const topic of topics) {
        const topicArticles = await fetchTopicArticles(
          topic,
          sources,
          process.env.NEWS_API_KEY
        )
        allArticles.push(...topicArticles)
      }
    }

    // Return 404 if no articles were found
    if (allArticles.length === 0) {
      return NextResponse.json({ error: "No articles found" }, { status: 404 })
    }

    // Return all articles with their topics
    return NextResponse.json({ articles: allArticles })
  } catch (error: any) {
    // Handle any unexpected errors during the API call
    console.error("News API Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch news articles: " + (error.message || "Unknown error"),
      },
      { status: 500 },
    )
  }
}

