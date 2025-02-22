import { NextResponse } from "next/server"
import OpenAI from "openai"

// Reduce max duration to 25 seconds to allow for proper timeout handling
export const maxDuration = 25

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
  }

  try {
    const { articles, preferences } = await req.json()

    // Simplify the article formatting to reduce prompt size
    const formattedArticles = articles.map((article: any) => ({
      title: article.title,
      description: article.description?.slice(0, 150), // Limit description length
      url: article.url,
      topic: article.topic || 'general'
    }))

    const prompt = `Summarize these news articles in a ${preferences.tone || "casual"} tone, 
      targeting a ${preferences.readingTime || "5"} minute read in ${preferences.language || "english"}:
      ${JSON.stringify(formattedArticles, null, 2)}
      
      Format in HTML with:
      - <section> tags for each topic
      - <h2> headers
      - <p> tags for paragraphs
      - Source links as <a> tags
      `

    // Add timeout to OpenAI call
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    })

    clearTimeout(timeoutId)

    if (!completion.choices[0]?.message?.content) {
      throw new Error("No summary generated")
    }

    return NextResponse.json({ 
      summary: completion.choices[0].message.content 
    })

  } catch (error: any) {
    console.error("Summary Generation Error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })

    // Handle specific error cases
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: "Request timed out while generating summary" 
      }, { status: 504 })
    }

    if (error.code === 'ECONNABORTED') {
      return NextResponse.json({ 
        error: "Connection aborted while generating summary" 
      }, { status: 504 })
    }

    return NextResponse.json({
      error: "Failed to generate summary",
      details: error.message
    }, { status: 500 })
  }
}

