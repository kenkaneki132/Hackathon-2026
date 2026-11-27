// Small stroke icon set (24x24 grid, currentColor). Replaces emoji so icons render the same on every OS.
const PATHS = {
  shield: 'M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6l7-3z',
  shieldCheck: 'M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6l7-3z M9 12l2 2 4-4',
  chart: 'M3 20h18 M6 16v-5 M11 16V7 M16 16v-8 M21 16v-3',
  chat: 'M20 12a8 8 0 0 1-11.7 7.1L4 20l1-4.1A8 8 0 1 1 20 12z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  arrowRight: 'M5 12h14 M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5 M11 6l-6 6 6 6',
  send: 'M4 12l16-8-6 16-2.6-6.4L4 12z',
  clipboard: 'M9 3h6v3H9z M7 4.5H5V21h14V4.5h-2 M8.5 11h7 M8.5 15h4.5',
  calendar: 'M4 6h16v15H4z M4 10.5h16 M8 3v4 M16 3v4',
  wallet: 'M3 7.5h16a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5z M3 7.5L15 4v3.5 M16 14h2',
  umbrella: 'M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z M12 12v6.5a2 2 0 0 0 4 0',
  waves: 'M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2 M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z',
  trending: 'M3 17l6-6 4 4 8-8 M15 7h6v6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  alert: 'M12 3.5l9.5 17h-19L12 3.5z M12 10v4.5 M12 17.6v.01',
  sparkles: 'M11 3l1.7 4.8L17.5 9.5l-4.8 1.7L11 16l-1.7-4.8L4.5 9.5l4.8-1.7L11 3z M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z',
  volume: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4z M16 9.5a3.5 3.5 0 0 1 0 5 M18.5 7a7 7 0 0 1 0 10',
  stop: 'M7 7h10v10H7z',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7 M20 4.5V11h-6.5',
  dollar: 'M12 3v18 M16.5 7.5C16.5 5.8 14.5 5 12 5s-4.5 1-4.5 3 2.2 2.6 4.5 3 4.5 1 4.5 3.2S14.5 18 12 18s-4.5-.9-4.5-2.7',
  home: 'M3 11l9-7 9 7 M5.5 9.5V20h13V9.5 M10 20v-5h4v5',
  lock: 'M6 11h12v10H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  briefcase: 'M3 8h18v12H3z M8.5 8V5h7v3 M3 13h18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5.5 M12 7.6v.01',
  piggy: 'M5 11a6 5 0 0 1 6-5h3a6 5 0 0 1 6 5v1.5l1.5 1V16l-1.6.6A6 5 0 0 1 16 19.5V21h-2.5v-1.2h-3V21H8v-1.8A6 5 0 0 1 5 14.5H3V11h2z M15.5 10.5v.01 M9 6.3A2.5 2.5 0 1 1 13 4',
}

export default function Icon({ name, size = 18, strokeWidth = 1.8, title, style, className }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}
      style={{ flex: 'none', ...style }} className={className}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  )
}

export const ICON_NAMES = Object.keys(PATHS)
