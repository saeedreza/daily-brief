import { Preferences } from "@/components/preferences"
import { NewsBrief } from "@/components/news-brief"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Daily Brief</h1>
          <p className="text-muted-foreground">Your personalized news summary, tailored to your preferences.</p>
        </div>
        <div className="grid gap-8">
          <Preferences />
          <NewsBrief />
        </div>
      </div>
    </main>
  )
}

