/**
 * A simple, high-contrast confirmation modal with large tap targets. Preferred
 * over a timed snackbar-undo for this app's audience: an elderly user who reads
 * slowly won't lose their chance to react (plan item F / §1.2).
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Remove',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-lg font-bold text-slate-900">{title}</p>
        {body && <p className="mt-2 text-sm text-slate-600">{body}</p>}
        <div className="mt-6 flex gap-3">
          <button className="btn-ghost flex-1" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn flex-1 ${
              danger ? 'bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
