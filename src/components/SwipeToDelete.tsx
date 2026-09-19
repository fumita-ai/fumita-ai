import { useRef, useState, type ReactNode } from 'react';
import { TrashIcon } from './icons';

const OPEN_WIDTH = 88;
/** これ以上横に動いたら、縦スクロールではなくスワイプとみなす。 */
const DIRECTION_THRESHOLD = 8;

/**
 * 行を左にスワイプすると右側に「削除」ボタンが現れる(要件 10 章)。
 * 開いている行は同時に 1 つだけになるよう、開閉状態は親が持つ。
 */
export function SwipeToDelete({
  open,
  onOpenChange,
  onDelete,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const [offset, setOffset] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number; base: number } | null>(null);
  const axis = useRef<'undecided' | 'horizontal' | 'vertical'>('undecided');
  const moved = useRef(false);

  const translate = offset ?? (open ? -OPEN_WIDTH : 0);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, base: open ? -OPEN_WIDTH : 0 };
    axis.current = 'undecided';
    moved.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (s === null) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;

    if (axis.current === 'undecided') {
      if (Math.abs(dx) < DIRECTION_THRESHOLD && Math.abs(dy) < DIRECTION_THRESHOLD) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      if (axis.current === 'vertical') {
        start.current = null;
        return;
      }
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }

    moved.current = true;
    // 左方向のみ。開ききった位置を超えて引っ張らない。
    setOffset(Math.max(-OPEN_WIDTH, Math.min(0, s.base + dx)));
  };

  const endDrag = () => {
    if (start.current === null || axis.current !== 'horizontal') {
      start.current = null;
      return;
    }
    const current = offset ?? 0;
    onOpenChange(current < -OPEN_WIDTH / 2);
    setOffset(null);
    start.current = null;
  };

  return (
    <div className="swipe">
      <button type="button" className="swipe__delete" onClick={onDelete} tabIndex={open ? 0 : -1}>
        <TrashIcon />
        削除
      </button>
      <div
        className={`swipe__content${offset === null ? ' swipe__content--animated' : ''}`}
        style={{ transform: `translateX(${translate}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          // スワイプの直後に出るクリックは握りつぶす(開閉状態は変えない)。
          if (moved.current) {
            e.stopPropagation();
            e.preventDefault();
            moved.current = false;
            return;
          }
          // 開いている行をタップしたときは、行の操作ではなく閉じる操作にする。
          if (open) {
            e.stopPropagation();
            e.preventDefault();
            onOpenChange(false);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
