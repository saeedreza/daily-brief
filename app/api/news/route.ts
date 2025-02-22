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

interface MediaStackError {
  code?: string;
  message: string;
  context?: Record<string, string[]>;
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
  params.append("countries", "us")
  params.append("limit", "100")
  params.append("sort", "published_desc")

  const url = `${baseUrl}?${params.toString()}`
  console.log("Fetching from URL:", url)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    // Log the full response for debugging
    console.log("MediaStack Response Status:", response.status)
    console.log("MediaStack Response Headers:", Object.fromEntries(response.headers))

    const data = await response.json()

    // Log the actual response data structure
    console.log("MediaStack Response Data Structure:", {
      hasError: !!data.error,
      hasData: !!data.data,
      dataLength: data.data?.length,
      errorDetails: data.error,
    })

    if (data.error) {
      const error: MediaStackError = typeof data.error === 'string' 
        ? { message: data.error }
        : data.error

      // Handle specific error cases
      switch(error.code) {
        case 'invalid_access_key':
        case 'missing_access_key':
          throw new Error('Invalid or missing API key')
        case 'usage_limit_reached':
          throw new Error('API usage limit reached')
        case 'rate_limit_reached':
          throw new Error('API rate limit reached')
        default:
          throw new Error(error.message || "MediaStack API Error")
      }
    }

    if (!Array.isArray(data.data)) {
      console.error("Unexpected data structure:", data)
      throw new Error("Invalid response format from MediaStack API")
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
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers })
  }

  try {
    const { searchParams } = new URL(request.url)
    const topics = searchParams.get('topics')?.split(',') || ['general']
    
    console.log('Requested topics:', topics)
    
    const MEDIASTACK_API_KEY = process.env.MEDIASTACK_API_KEY

    if (!MEDIASTACK_API_KEY) {
      throw new Error('MediaStack API key is not configured')
    }

    // Initialize params for MediaStack API
    const params = new URLSearchParams()
    params.append('categories', topics[0])
    params.append('limit', '5')
    
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

    return NextResponse.json({ articles: trimmedArticles }, { headers })

  } catch (error: unknown) {
    console.error('Detailed API Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      topics: new URL(request.url).searchParams.get('topics')
    })

    // Map common error messages to appropriate HTTP status codes
    let status = 500
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('Invalid or missing API key')) {
      status = 401
    } else if (errorMessage.includes('API usage limit reached') || 
               errorMessage.includes('API rate limit reached')) {
      status = 429
    }

    return NextResponse.json(
      { error: 'Failed to fetch news', details: errorMessage },
      { status, headers }
    )
  }
}

