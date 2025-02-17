import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Set maximum execution time for this serverless function to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  // Verify OpenAI API key is configured in environment variables
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
  }

  try {
    const { articles, preferences } = await req.json()

    // Group articles by topic
    const articlesByTopic = articles.reduce((acc: any, article: any) => {
      const topic = article.topic || "general"
      if (!acc[topic]) acc[topic] = []
      acc[topic].push(article)
      return acc
    }, {})

    // Construct a more structured prompt
    const prompt = `
      You are a professional news curator and summarizer. Create a comprehensive news brief with these parameters:
      - Writing style: ${preferences.tone || "casual"}
      - Language: ${preferences.language || "english"}
      - Length: A ${preferences.readingTime || "5"} minute read

      Here are the news articles by topic:
      ${(Object.entries(articlesByTopic) as [string, { title: string; description: string; url: string; source: { name: string } }[]][])
        .map(([topic, topicArticles]) => `
          ${topic.toUpperCase()}:
          ${topicArticles
            .map((article, index: number) =>
              `${index + 1}. ${article.title}\n${article.description}\nSource: ${article.source.name} (${article.url})`
            )
            .join("\n\n")
          }
        `)
        .join("\n\n---\n\n")}
      
      Guidelines:
      - Format the output in HTML with proper markup
      - Each topic should be in a <section> tag with an <h2> header
      - Wrap paragraphs in <p> tags
      - Use <hr> tags between sections
      - Select and highlight the most important stories from each topic
      - Maintain the specified tone throughout
      - Connect related stories across topics where appropriate
      - Prioritize the most impactful and recent developments
      - Include source links directly in the text using <a> tags

      Format the output like this:
      <section class="mb-8">
        <h2 class="text-2xl font-bold mb-4 text-primary">TOPIC NAME</h2>
        <p class="text-base leading-relaxed mb-4">Example sentence with a source <a href="https://reuters.com/article1" target="_blank" class="text-blue-600 hover:underline">[1]</a> and another source<a href="https://cnn.com/article2" target="_blank" class="text-blue-600 hover:underline">[2]</a>.</p>
      </section>
      <hr class="my-6 border-t border-gray-200 dark:border-gray-700">
      <section class="mb-8">
        <h2 class="text-2xl font-bold mb-4 text-primary">ANOTHER TOPIC</h2>
        <p class="text-base leading-relaxed mb-4">More news content with additional sources.</p>
      </section>
    `

    // Generate summary using OpenAI GPT-4
    console.log("Generating text with OpenAI...")
    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt,
      temperature: 0.7, // Controls randomness in the output (0.7 provides a good balance)
      maxTokens: 1000, // Limit response length
    })

    if (!text) {
      throw new Error("No summary was generated")
    }

    return NextResponse.json({ summary: text })
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error("Summary Generation Error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })

    // Handle specific error types with appropriate error messages
    if (error.name === "AI_LoadAPIKeyError") {
      return NextResponse.json({ error: "OpenAI API key is invalid or not properly configured" }, { status: 500 })
    }

    if (error.name === "AI_RequestError") {
      return NextResponse.json({ error: "Failed to communicate with OpenAI API" }, { status: 500 })
    }

    // Generic error handler with detailed error information
    return NextResponse.json(
      {
        error: "Failed to generate summary: " + (error.message || "Unknown error"),
        details: {
          name: error.name,
          message: error.message,
        },
      },
      { status: 500 },
    )
  }
}

