export function Logo({ size = 28, withLabel = true }: { size?: number; withLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="46" height="46" rx="11" fill="white" stroke="#18181B" strokeWidth="2" />
        <path
          d="M17 13a1 1 0 0 1 1-1h8l7 7v18a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1V13Z"
          stroke="#18181B"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M27 10v6a1 1 0 0 0 1 1h6" stroke="#18181B" strokeWidth="2" strokeLinejoin="round" />
        <path d="M19 23h10M19 28h10M19 33h6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {withLabel && <span className="font-semibold text-lg tracking-tight">Notia</span>}
    </div>
  );
}
