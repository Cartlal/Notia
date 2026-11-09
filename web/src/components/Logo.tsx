export function Logo({ size = 28, withLabel = true }: { size?: number; withLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="/logo.png" alt="" width={size} height={size} className="rounded-lg" style={{ width: size, height: size }} />
      {withLabel && <span className="font-semibold text-lg tracking-tight">Notia</span>}
    </div>
  );
}
