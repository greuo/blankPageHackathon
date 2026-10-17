import { useEffect, useRef, type ReactNode } from 'react';
import { X, HeartHandshake } from 'lucide-react';
export function Logo() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <HeartHandshake size={23} />
      </span>
      <span>
        discharge<span className="brand-bottom">companion</span>
      </span>
    </span>
  );
}
export function Avatar({
  name,
  initials,
  small = false,
}: {
  name: string;
  initials: string;
  small?: boolean;
}) {
  return (
    <span className={`avatar ${small ? 'small' : ''}`} title={name} aria-label={name}>
      {initials}
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className={`modal ${wide ? 'wide' : ''}`}
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key !== 'Tab' || !ref.current) return;
        const nodes = Array.from(
          ref.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]',
          ),
        ).filter((node) => {
          if (!node.getClientRects().length || node.closest('[hidden], [inert]')) return false;
          const closedDetails = node.closest('details:not([open])');
          return !closedDetails || node === closedDetails.querySelector(':scope > summary');
        });
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (!first) {
          event.preventDefault();
          ref.current.focus();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === ref.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <header className="dialog-header">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-btn" aria-label="Close dialog" onClick={onClose}>
          <X size={21} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Skeleton({
  kind = 'cards',
}: {
  kind?: 'cards' | 'conversation' | 'plan' | 'checklist';
}) {
  return (
    <div className={`skeletons ${kind}`} role="status" aria-label={`Loading ${kind}`}>
      {Array.from({ length: kind === 'cards' ? 5 : 3 }, (_, i) => (
        <div className="skeleton" key={i}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export const errorText = (e: unknown) =>
  e instanceof Error ? e.message : 'Could not save. Please try again.';
export const time = (value: string) =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
