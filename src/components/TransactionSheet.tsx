import { useMemo, useState } from 'react';
import { AMOUNT_MAX, AMOUNT_MIN, CATEGORIES, MEMO_MAX_LENGTH } from '../constants';
import { formatAmountInput, formatComma, parseAmountInput } from '../lib/format';
import { isValidDateStr } from '../lib/date';
import type { CategoryId, Transaction, TransactionType } from '../types';
import type { NewTransaction } from '../store';
import { CategoryGlyph } from './icons';
import { Sheet } from './Sheet';

export type TransactionSheetMode =
  | { kind: 'create' }
  | { kind: 'edit'; transaction: Transaction };

/**
 * 登録モーダル / 編集モード(要件 9.1 / 9.3)。
 * 編集モードでは種別を変更できず、タブは非活性になる。
 */
export function TransactionSheet({
  mode,
  today,
  onSubmit,
  onDismiss,
}: {
  mode: TransactionSheetMode;
  today: string;
  onSubmit: (input: NewTransaction) => void;
  onDismiss: () => void;
}) {
  const editing = mode.kind === 'edit' ? mode.transaction : null;

  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense');
  const [amountText, setAmountText] = useState(
    editing === null ? '' : formatComma(editing.amount),
  );
  const [category, setCategory] = useState<CategoryId | null>(editing?.category ?? null);
  const [date, setDate] = useState(editing?.date ?? today);
  const [memo, setMemo] = useState(editing?.memo ?? '');

  const amount = parseAmountInput(amountText);

  const amountError = useMemo(() => {
    if (amountText === '') return null;
    if (amount < AMOUNT_MIN) return `${AMOUNT_MIN} 円以上で入力してください`;
    if (amount > AMOUNT_MAX) return `${formatComma(AMOUNT_MAX)} 円以下で入力してください`;
    return null;
  }, [amountText, amount]);

  const dateValid = isValidDateStr(date);

  const canSubmit =
    amountError === null &&
    amount >= AMOUNT_MIN &&
    amount <= AMOUNT_MAX &&
    dateValid &&
    (type === 'income' || category !== null);

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      type,
      amount,
      category: type === 'expense' ? category : null,
      date,
      memo: memo.trim(),
    });
  };

  const title = editing === null ? '記録する' : '記録を編集';

  return (
    <Sheet
      title={title}
      onDismiss={onDismiss}
      footer={
        <button type="button" className="btn" disabled={!canSubmit} onClick={submit}>
          {editing === null ? '登録' : '更新'}
        </button>
      }
    >
      <div className="segmented" role="tablist" aria-label="種別">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            className="segmented__item"
            aria-selected={type === t}
            disabled={editing !== null}
            onClick={() => setType(t)}
          >
            {t === 'expense' ? '支出' : '収入'}
          </button>
        ))}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="tx-amount">
          金額
        </label>
        <div className="amount-row">
          <span className="amount-row__yen">¥</span>
          <input
            id="tx-amount"
            className="field__input field__input--amount num"
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            placeholder="0"
            value={amountText}
            onChange={(e) => setAmountText(formatAmountInput(e.target.value))}
          />
        </div>
        {amountError !== null && <p className="field__hint field__hint--error">{amountError}</p>}
      </div>

      {type === 'expense' && (
        <div className="field">
          <span className="field__label">カテゴリ</span>
          <div className="cat-picker">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="cat-picker__item"
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                <span
                  className="cat-badge"
                  style={{ width: 32, height: 32, background: c.color }}
                >
                  <CategoryGlyph id={c.id} />
                </span>
                <span className="cat-picker__name">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor="tx-date">
          日付
        </label>
        <input
          id="tx-date"
          type="date"
          className="field__input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {!dateValid && <p className="field__hint field__hint--error">日付を入力してください</p>}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="tx-memo">
          メモ
        </label>
        <input
          id="tx-memo"
          className="field__input"
          placeholder="任意"
          maxLength={MEMO_MAX_LENGTH}
          enterKeyHint="done"
          value={memo}
          onChange={(e) => setMemo(e.target.value.slice(0, MEMO_MAX_LENGTH))}
        />
        <p className="field__counter num">
          {memo.length} / {MEMO_MAX_LENGTH}
        </p>
      </div>
    </Sheet>
  );
}
