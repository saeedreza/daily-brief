"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Preferences {
  tone: string
  language: string
  readingTime: number
  topics: string[]
}

const TOPICS = [
  { label: "Business", value: "business" },
  { label: "Technology", value: "technology" },
  { label: "Entertainment", value: "entertainment" },
  { label: "Health", value: "health" },
  { label: "Science", value: "science" },
  { label: "Sports", value: "sports" },
  { label: "General", value: "general" },
] as const

export function Preferences() {
  const [preferences, setPreferences] = useState<Preferences>({
    tone: "casual",
    language: "english",
    readingTime: 5,
    topics: ["general"],
  })

  useEffect(() => {
    const savedPreferences = localStorage.getItem("preferences")
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences))
    }
  }, [])

  const updatePreferences = (key: keyof Preferences, value: string | number | boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    localStorage.setItem("preferences", JSON.stringify(newPreferences))
  }

  const toggleTopic = (topic: string) => {
    const currentTopics = preferences?.topics || ["general"]
    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter((t) => t !== topic)
      : [...currentTopics, topic]
    
    const newPreferences = { ...preferences, topics: newTopics }
    setPreferences(newPreferences)
    localStorage.setItem("preferences", JSON.stringify(newPreferences))
  }

  const currentTopics = preferences?.topics || ["general"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Preferences</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        <div className="grid gap-2">
          <Label htmlFor="tone">Tone</Label>
          <Select value={preferences.tone} onValueChange={(value: string) => updatePreferences("tone", value)}>
            <SelectTrigger id="tone">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="language">Language</Label>
          <Select value={preferences.language} onValueChange={(value: string) => updatePreferences("language", value)}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Topics of Interest</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {currentTopics.map((topic) => (
              <Badge
                key={topic}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleTopic(topic)}
              >
                {TOPICS.find((t) => t.value === topic)?.label}
                <span className="ml-1">×</span>
              </Badge>
            ))}
          </div>
          <Command className="border rounded-md">
            <CommandInput placeholder="Search topics..." />
            <CommandEmpty>No topics found.</CommandEmpty>
            <CommandGroup className="max-h-48 overflow-auto">
              {TOPICS.map((topic) => (
                <CommandItem
                  key={topic.value}
                  onSelect={() => toggleTopic(topic.value)}
                  className="flex items-center justify-between"
                >
                  <span>{topic.label}</span>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      currentTopics.includes(topic.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </div>

        <div className="grid gap-4">
          <Label>Reading Time (minutes)</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[preferences.readingTime]}
              onValueChange={([value]: [number]) => updatePreferences("readingTime", value)}
              min={1}
              max={15}
              step={1}
            />
            <span className="w-12 text-sm">{preferences.readingTime}m</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

