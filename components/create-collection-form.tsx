"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  relays: z.array(
    z.object({
      url: z.string().url("Must be a valid URL").regex(/^wss:\/\//, "Must start with wss://"),
    })
  ).min(1, "At least one relay is required"),
})

type FormData = z.infer<typeof formSchema>

interface CreateCollectionFormProps {
  onSave: (collection: { name: string; relays: string[] }) => void
  initialData?: { name: string; relays: string[] }
}

const removeTrailingSlash = (url: string) => url.endsWith('/') ? url.slice(0, -1) : url

const cleanRelayUrl = (url: string) => {
  // Remove any existing wss:// prefixes (could be multiple if pasted)
  const cleanUrl = url.replace(/^(wss:\/\/)+(.*)/g, '$2')
  return removeTrailingSlash(cleanUrl)
}

export function CreateCollectionForm({ onSave, initialData }: CreateCollectionFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      relays: initialData?.relays 
        ? initialData.relays.map(url => ({ url: removeTrailingSlash(url) }))
        : [{ url: "wss://" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "relays",
  })

  function onSubmit(values: FormData) {
    onSave({
      name: values.name,
      relays: values.relays.map(relay => removeTrailingSlash(relay.url)),
    })
    form.reset({
      name: "",
      relays: [{ url: "wss://" }]
    })
  }

  const handleRelayChange = (value: string, onChange: (value: string) => void) => {
    const cleanValue = cleanRelayUrl(value)
    onChange(`wss://${cleanValue}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection Name</FormLabel>
              <FormControl>
                <Input placeholder="My Collection" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Relays</FormLabel>
          {fields.map((field, index) => (
            <FormField
              key={field.id}
              control={form.control}
              name={`relays.${index}.url`}
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <FormControl>
                      <div className="flex">
                        <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                          wss://
                        </div>
                        <Input
                          className="rounded-l-none"
                          placeholder="relay.example.com"
                          {...fieldProps}
                          value={value.replace('wss://', '')}
                          onChange={(e) => handleRelayChange(e.target.value, onChange)}
                        />
                      </div>
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ url: "wss://" })}
          >
            Add Relay
          </Button>
        </div>

        <Button type="submit" className="w-full">
          {initialData ? "Save Changes" : "Create Collection"}
        </Button>
      </form>
    </Form>
  )
} 