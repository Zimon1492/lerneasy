import Image from "next/image";

const COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-teal-500",
];

function colorFor(name: string | null | undefined): string {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = {
  src?: string | null;
  name?: string | null;
  size?: number; // px — used for width/height on the Image
  className?: string; // extra classes on the wrapper (e.g. "w-16 h-16")
};

export default function Avatar({ src, name, size = 64, className = "w-16 h-16" }: Props) {
  return (
    <div className={`relative rounded-full overflow-hidden shrink-0 ${className}`}>
      {src ? (
        <Image src={src} alt={name ?? "Profilbild"} fill className="object-cover" sizes={`${size}px`} />
      ) : (
        <div className={`w-full h-full flex items-center justify-center text-white font-bold select-none ${colorFor(name)}`}
          style={{ fontSize: `${Math.round(size * 0.36)}px` }}>
          {initials(name)}
        </div>
      )}
    </div>
  );
}
