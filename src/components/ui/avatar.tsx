import { cn, initials } from "@/lib/utils";

interface Props {
  name?: string | null;
  size?: number;
  className?: string;
}

// Stable colour per candidate, derived from the initials.
const palettes = [
  "from-violet-600 to-fuchsia-500",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-purple-500",
];

function paletteFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palettes[Math.abs(h) % palettes.length]!;
}

export function Avatar({ name, size = 40, className }: Props) {
  const init = initials(name);
  const palette = paletteFor(name ?? "??");
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-gradient-to-br text-white font-semibold ring-1 ring-white/10",
        palette,
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {init}
    </div>
  );
}
