import { initials } from "@/lib/format";

const COLORS = ["from-orange-400 to-amber-700", "from-emerald-400 to-teal-700", "from-rose-400 to-pink-700", "from-sky-400 to-indigo-700"];

export function Avatar({ name, size = 40, index = 0 }: { name: string; size?: number; index?: number }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${COLORS[index % COLORS.length]} font-semibold text-white ring-2 ring-black/40`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
