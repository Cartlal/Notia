export function Logo({ size = 28, withLabel = true }: { size?: number; withLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="url(#notia-grad)" />
        <path
          d="M14 13a3 3 0 0 1 3-3h10l7 7v18a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V13Z"
          fill="white"
          fillOpacity="0.14"
        />
        <path d="M27 10v6a1 1 0 0 0 1 1h6" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        <path
          d="M17 13a1 1 0 0 1 1-1h8l7 7v18a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1V13Z"
          stroke="white"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M19 23h10M19 28h10M19 33h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="notia-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B78FF" />
            <stop offset="1" stopColor="#4A31BD" />
          </linearGradient>
        </defs>
      </svg>
      {withLabel && <span className="font-semibold text-lg tracking-tight">Notia</span>}
    </div>
  );
}
