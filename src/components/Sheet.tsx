import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';

/**
 * 画面下部から出るボトムシート。
 * モーダル外(暗い部分)のタップで閉じる(要件 9.1 / 9.2 / 9.3)。
 */
export function Sheet({
  title,
  onDismiss,
  children,
  footer,
}: {
  title: string;
  onDismiss: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return createPortal(
    <>
      <div className="sheet__backdrop" onClick={onDismiss} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__grabber" />
        <div className="sheet__head">
          <span className="sheet__title">{title}</span>
          <button type="button" className="icon-btn icon-btn--sm sheet__close" onClick={onDismiss}>
            <CloseIcon />
            <span className="sr-only">閉じる</span>
          </button>
        </div>
        <div className="sheet__scroll">{children}</div>
        {footer !== undefined && <div className="sheet__footer">{footer}</div>}
      </div>
    </>,
    document.body,
  );
}
