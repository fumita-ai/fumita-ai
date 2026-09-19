import { createPortal } from 'react-dom';

/** 削除などの確認ダイアログ(要件 10 章 / 11 章)。 */
export function ConfirmDialog({
  title,
  text,
  confirmLabel,
  cancelLabel = 'キャンセル',
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  text?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return createPortal(
    <div className="dialog__backdrop" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog__body">
          <p className="dialog__title">{title}</p>
          {text !== undefined && <p className="dialog__text">{text}</p>}
        </div>
        <div className="dialog__actions">
          <button type="button" className="dialog__btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`dialog__btn${danger ? ' dialog__btn--danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
