export default function LibraryIcon({ size = 28, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {/* Repare nos nomes dos atributos: strokeWidth / strokeLinecap */}
      {/* E na cor: troquei #ffffff por currentColor para herdar a cor do pai */}
      <path d="M3 5h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="4" y="7" width="16" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}
