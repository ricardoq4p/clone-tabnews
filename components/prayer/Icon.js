const paths = {
  cross: <path d="M10 2h4v7h7v4h-7v9h-4v-9H3V9h7z" />,
  home: (
    <>
      <path d="m3 10 9-7 9 7v11H3Z" />
      <path d="M9 21v-8h6v8" />
    </>
  ),
  rosary: (
    <>
      <ellipse
        cx="12"
        cy="9"
        rx="7"
        ry="6"
        strokeDasharray="1 3"
        strokeWidth="3"
      />
      <path d="M12 15v7m-3-3h6" />
    </>
  ),
  candle: (
    <>
      <path d="M8 10h8v11H8zM7 21h10" />
      <path d="M12 2c-5 5-1 8 1 5 1-2-1-3-1-5Z" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 5c3 0 3 3 3 6" />
    </>
  ),
  book: (
    <>
      <path d="M3 4q5-2 9 1 4-3 9-1v16q-5-2-9 1-4-3-9-1ZM12 5v16" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  back: <path d="M20 12H4m6-6-6 6 6 6" />,
  heart: <path d="M12 21 3.5 12.5C-2 6 7 0 12 7c5-7 14-1 8.5 5.5Z" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  message: (
    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
  ),
  check: <path d="m5 12 4 4L20 5" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="12" rx="2" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
    </>
  ),
  close: <path d="m5 5 14 14M5 19 19 5" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  leaf: (
    <>
      <path d="M4 20C0 8 12 2 21 3c0 12-5 18-17 17ZM4 20 16 8" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="9" cy="18" r="2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 3 6v7c0 5 9 9 9 9s9-4 9-9V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
};
export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.cross}
    </svg>
  );
}
