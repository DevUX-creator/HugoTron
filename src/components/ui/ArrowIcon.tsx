/** Shared decorative hook arrow. The containing link or button supplies its name. */
export default function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 12" fill="none" aria-hidden="true" focusable="false">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.90429 .5v5.31849H12.5581L9.75077 3.01116l1.19043-1.19047 4.8396 4.83957-4.8396 4.83954-1.19043-1.1904 2.80733-2.80732H.220703V.5H1.90429Z"
        fill="currentColor"
      />
    </svg>
  );
}
