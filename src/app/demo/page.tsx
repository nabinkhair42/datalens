'use client';

import { Button } from '@/components/ui/button';

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-2xl font-bold text-foreground">Button Variants</h1>

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="default" onClick={() => alert('Default clicked')}>
          Default
        </Button>
        <Button variant="outline" onClick={() => alert('Outline clicked')}>
          Outline
        </Button>
        <Button variant="secondary" onClick={() => alert('Secondary clicked')}>
          Secondary
        </Button>
        <Button variant="ghost" onClick={() => alert('Ghost clicked')}>
          Ghost
        </Button>
        <Button variant="destructive" onClick={() => alert('Destructive clicked')}>
          Destructive
        </Button>
        <Button variant="link" onClick={() => alert('Link clicked')}>
          Link
        </Button>
      </div>

      <h2 className="text-xl font-semibold text-foreground">With HotKeys</h2>

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="default" hotKeys="Mod+S" onClick={() => alert('Mod+S triggered!')}>
          Save (Cmd+S)
        </Button>
        <Button variant="outline" hotKeys="Mod+K" onClick={() => alert('Mod+K triggered!')}>
          Search (Cmd+K)
        </Button>
        <Button
          variant="secondary"
          hotKeys="Mod+Enter"
          onClick={() => alert('Mod+Enter triggered!')}
        >
          Execute (Cmd+Enter)
        </Button>
        <Button variant="default" disabled hotKeys="Mod+D">
          Disabled (Cmd+D)
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Try pressing Cmd+S, Cmd+K, or Cmd+Enter. Cmd+D is disabled.
      </p>
    </div>
  );
}
