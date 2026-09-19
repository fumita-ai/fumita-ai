import { CATEGORY_MAP } from '../constants';
import { formatMonthDayWeekday } from '../lib/date';
import { formatYen } from '../lib/format';
import type { Transaction } from '../types';
import { Sheet } from './Sheet';

/** 詳細モーダル(要件 9.2)。 */
export function DetailSheet({
  transaction,
  onEdit,
  onDismiss,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDismiss: () => void;
}) {
  const isExpense = transaction.type === 'expense';

  return (
    <Sheet
      title="記録の詳細"
      onDismiss={onDismiss}
      footer={
        <div className="sheet__actions">
          <button type="button" className="btn btn--secondary" onClick={onDismiss}>
            閉じる
          </button>
          <button type="button" className="btn" onClick={onEdit}>
            編集
          </button>
        </div>
      }
    >
      <div className="detail-list">
        <div className="detail-item">
          <span className="detail-item__label">種別</span>
          <span className="detail-item__value">{isExpense ? '支出' : '収入'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">日付</span>
          <span className="detail-item__value num">{formatMonthDayWeekday(transaction.date)}</span>
        </div>
        {isExpense && transaction.category !== null && (
          <div className="detail-item">
            <span className="detail-item__label">カテゴリ</span>
            <span className="detail-item__value">{CATEGORY_MAP[transaction.category].label}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-item__label">金額</span>
          <span
            className="detail-item__value detail-item__value--amount num"
            style={{ color: isExpense ? 'var(--expense)' : 'var(--income)' }}
          >
            {isExpense ? '−' : '+'}
            {formatYen(transaction.amount)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">メモ</span>
          <span className="detail-item__value">
            {transaction.memo === '' ? '（なし）' : transaction.memo}
          </span>
        </div>
      </div>
    </Sheet>
  );
}
