"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

interface Tab {
  value: string
  label: string
}

interface PageHeaderProps {
  title: string
  description: string
  tabs?: Tab[]
}

export function PageHeader({
  title,
  description,
  tabs,
}: PageHeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="w-full border-b bg-background">
      <div className="w-full p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        {tabs && (
          <div className="mt-4">
            <Tabs defaultValue={tabs[0].value}>
              <TabsList className="h-auto p-0 bg-transparent">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
} 