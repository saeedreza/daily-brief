import { NextResponse } from "next/server"

interface NewsArticle {
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

/**
 * Fetches articles from MediaStack API
 */
async function fetchMediaStackArticles(
  params: URLSearchParams,
  apiKey: string
): Promise<NewsArticle[]> {
  const baseUrl = "http://api.mediastack.com/v1/news"
  
  // Add required parameters
  params.append("access_key", apiKey)
  params.append("languages", "en")
  params.append("countries", "us") // Add US news focus
  params.append("limit", "100")
  params.append("sort", "published_desc")

  const url = `${baseUrl}?${params.toString()}`
  console.log("Fetching from URL:", url) // Debug log

  try {
    const response = await fetch(url)
    const data = await response.json()

    console.log("MediaStack Response:", {
      status: response.status,
      pagination: data.pagination,
      totalResults: data.data?.length,
    })

    if (data.error) {
      throw new Error(
        typeof data.error === 'string' 
          ? data.error 
          : data.error.message || "MediaStack API Error"
      )
    }

    return data.data || []
  } catch (error) {
    console.error("MediaStack API Error:", error)
    throw error
  }
}

/**
 * GET endpoint to fetch news from MediaStack API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const topics = searchParams.get('topics')?.split(',') || ['general']
    
    console.log('Requested topics:', topics)
    
    // Use MediaStack API key from .env
    const MEDIASTACK_API_KEY = process.env.MEDIASTACK_API_KEY

    if (!MEDIASTACK_API_KEY) {
      throw new Error('MediaStack API key is not configured')
    }

    // Initialize params for MediaStack API
    const params = new URLSearchParams()
    params.append('categories', topics[0])
    params.append('limit', '5') // Limit to 5 articles
    
    const articles = await fetchMediaStackArticles(params, MEDIASTACK_API_KEY)

    // Trim article content to reduce token count
    const trimmedArticles = articles.slice(0, 5).map(article => ({
      ...article,
      description: article.description?.slice(0, 200) || '', // Limit description length
      title: article.title?.slice(0, 100) || '', // Limit title length
    }))

    if (trimmedArticles.length === 0) {
      return NextResponse.json(
        { error: 'No articles found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ articles: trimmedArticles })

  } catch (error: unknown) {
    console.error('Detailed API Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      topics: new URL(request.url).searchParams.get('topics')
    })
    return NextResponse.json(
      { error: 'Failed to fetch news', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

