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
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface Preferences {
  tone: string
  language: string
  readingTime: number
  topics: string[]
  politicalView: string
  customSources: string[]
  useCustomSources: boolean
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

const ALL_NEWS_SOURCES = [
  { value: "associated-press", label: "Associated Press", category: "neutral" },
  { value: "reuters", label: "Reuters", category: "neutral" },
  { value: "bloomberg", label: "Bloomberg", category: "neutral" },
  { value: "cnn", label: "CNN", category: "center-left" },
  { value: "nbc-news", label: "NBC News", category: "center-left" },
  { value: "time", label: "Time", category: "center-left" },
  { value: "the-wall-street-journal", label: "Wall Street Journal", category: "center-right" },
  { value: "the-hill", label: "The Hill", category: "center-right" },
  { value: "fox-news", label: "Fox News", category: "right" },
  { value: "national-review", label: "National Review", category: "right" },
  { value: "huffpost", label: "HuffPost", category: "left" },
  { value: "msnbc", label: "MSNBC", category: "left" },
  { value: "the-washington-post", label: "Washington Post", category: "left" },
] as const;

export function Preferences() {
  const [preferences, setPreferences] = useState<Preferences>({
    tone: "casual",
    language: "english",
    readingTime: 5,
    topics: ["general"],
    politicalView: "neutral",
    customSources: [],
    useCustomSources: false,
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

  const toggleSource = (source: string) => {
    const currentSources = preferences?.customSources || []
    const newSources = currentSources.includes(source)
      ? currentSources.filter((s) => s !== source)
      : [...currentSources, source]
    
    const newPreferences = { ...preferences, customSources: newSources }
    setPreferences(newPreferences)
    localStorage.setItem("preferences", JSON.stringify(newPreferences))
  }

  const currentTopics = preferences?.topics || ["general"]
  const currentSources = preferences?.customSources || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Preferences</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        <div className="grid gap-2">
          <Label htmlFor="tone">Tone</Label>
          <Select value={preferences.tone} onValueChange={(value) => updatePreferences("tone", value)}>
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
          <Select value={preferences.language} onValueChange={(value) => updatePreferences("language", value)}>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="news-sources">News Sources</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="custom-sources"
                checked={preferences.useCustomSources}
                onCheckedChange={(checked) => 
                  updatePreferences("useCustomSources", checked)
                }
              />
              <Label htmlFor="custom-sources" className="text-sm text-muted-foreground">
                Customize Sources
              </Label>
            </div>
          </div>

          {!preferences.useCustomSources ? (
            <Select 
              value={preferences.politicalView} 
              onValueChange={(value) => updatePreferences("politicalView", value)}
            >
              <SelectTrigger id="politicalView">
                <SelectValue placeholder="Select perspective" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left-Leaning</SelectItem>
                <SelectItem value="center-left">Center-Left</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="center-right">Center-Right</SelectItem>
                <SelectItem value="right">Right-Leaning</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {currentSources.map((sourceId) => {
                  const source = ALL_NEWS_SOURCES.find(s => s.value === sourceId)
                  return source && (
                    <Badge
                      key={sourceId}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleSource(sourceId)}
                    >
                      {source.label}
                      <span className="ml-1">×</span>
                    </Badge>
                  )
                })}
              </div>
              <Command className="border rounded-md h-auto">
                <CommandInput placeholder="Search news sources..." />
                <CommandEmpty>No sources found.</CommandEmpty>
                <CommandGroup className="max-h-48 overflow-auto">
                  {ALL_NEWS_SOURCES.map((source) => (
                    <CommandItem
                      key={source.value}
                      onSelect={() => toggleSource(source.value)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span>{source.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {source.category}
                        </Badge>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          currentSources.includes(source.value)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <Label>Reading Time (minutes)</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[preferences.readingTime]}
              onValueChange={([value]) => updatePreferences("readingTime", value)}
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

