import { useRef, type ReactNode } from 'react';

/**
 * A button that opens the native file chooser and hands back the selected File.
 * Reused across the import flows (CSV, JSON, prescription image).
 */
export function FilePicker({
  accept,
  capture,
  onFile,
  children,
  className = 'btn-primary w-full',
}: {
  accept?: string;
  /** Hint mobile to offer the camera, e.g. "environment" for prescriptions. */
  capture?: boolean | 'user' | 'environment';
  onFile: (file: File) => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        capture={capture}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so picking the same file again still fires onChange.
          e.target.value = '';
          if (file) onFile(file);
        }}
      />
    </>
  );
}
