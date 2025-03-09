'use client';

import { GalleryVerticalEnd, Moon, Sun } from "lucide-react"
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from "next-themes";
import HackerButton from "@/components/customComponents/HackerButton";
import { useNostr } from "@/contexts/nostr-context";
import { Particles } from "@/components/ui/particles";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Add type declaration for window.nostr
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      getProfile?(): Promise<{
        name?: string;
        picture?: string;
        about?: string;
        nip05?: string;
      }>;
    };
  }
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { login, hasExtension, continueAsGuest } = useNostr();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Initialize with system preference, if available
  const systemPreference = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
      ? "#ffffff"
      : "#000000"
    : "#ffffff";

  const [particleColor, setParticleColor] = useState(systemPreference);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && resolvedTheme) {
      setParticleColor(resolvedTheme === "dark" ? "#ffffff" : "#000000");
    }
  }, [resolvedTheme, mounted]);

  const handleNostrAuth = async () => {
    await login();
  };

  // After successful login
  const onSuccess = () => {
    router.push('/dashboard/feed')
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {mounted && (
        <>
          <Particles
            className="fixed inset-0"
            quantity={100}
            color={particleColor}
            ease={50}
          />
          
          <button
            className="fixed right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </>
      )}

      <div className="flex h-full w-full items-center justify-center">
        <div className="w-full max-w-[400px] space-y-6 rounded-lg border bg-background/80 backdrop-blur-sm p-8">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
              onClick={(e) => e.preventDefault()}
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">vermi</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to vermi</h1>
          </div>

          <div className="flex w-full flex-col gap-6">
            {hasExtension ? (
              <HackerButton
                text="Connect with Nostr"
                className="w-full bg-[#8e30eb] hover:bg-[#8e30eb]/80"
                onClick={handleNostrAuth}
              />
            ) : (
              <Button
                variant="default"
                className="w-full bg-[#8e30eb] hover:bg-[#8e30eb]/80 text-white"
                onClick={() => window.open("https://addons.mozilla.org/en-US/firefox/addon/nos2x-fox/", "_blank")}
              >
                Download NIP-07 Extension
              </Button>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={continueAsGuest}
            >
              Continue as Guest
            </Button>
          </div>

          <div className="text-muted-foreground text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
            By clicking continue, you agree to our <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>{" "}
            and <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  )
}
