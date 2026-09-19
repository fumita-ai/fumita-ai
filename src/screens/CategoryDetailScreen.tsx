import { useMemo, useState } from 'react';
import { CATEGORY_MAP } from '../constants';
import { filterByRange, sortForCategoryDetail } from '../lib/calc';
import {
  formatMonthDayWeekday,
  formatPeriodRange,
  formatPeriodTitle,
  periodRange,
  type Period,
} from '../lib/date';
import { formatYen } from '../lib/format';
import type { CategoryId, Transaction } from '../types';
import { SwipeToDelete } from '../components/SwipeToDelete';
import { ChevronLeft } from '../components/icons';

/** カテゴリ別の支出詳細画面(要件 6.2)。 */
export function CategoryDetailScreen({
  categoryId,
  period,
  transactions,
  onBack,
  onOpenDetail,
  onRequestDelete,
}: {
  categoryId: CategoryId;
  period: Period;
  transactions: Transaction[];
  onBack: () => void;
  onOpenDetail: (t: Transaction) => void;
  onRequestDelete: (t: Transaction) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const category = CATEGORY_MAP[categoryId];

  const { rows, total } = useMemo(() => {
    const inPeriod = filterByRange(transactions, periodRange(period)).filter(
      (t) => t.type === 'expense' && t.category === categoryId,
    );
    return {
      rows: sortForCategoryDetail(inPeriod),
      total: inPeriod.reduce((sum, t) => sum + t.amount, 0),
    };
  }, [transactions, period, categoryId]);

  return (
    <>
      <header className="hdr hdr--sub">
        <button type="button" className="back-btn" onClick={onBack}>
          <ChevronLeft />
          戻る
        </button>
        <span className="hdr__title">{category.label}</span>
        <span className="hdr__spacer" />
      </header>

      <div className="scroll scroll--padded">
        <section className="card">
          <div className="stat-row">
            <span className="stat-row__label num">
              {formatPeriodTitle(period)}（{formatPeriodRange(period)}）
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">合計</span>
            <span className="stat-row__value num">{formatYen(total)}</span>
          </div>
        </section>

        {rows.length === 0 ? (
          <p className="empty">この期間の支出はありません</p>
        ) : (
          <section className="card">
            <ul>
              {rows.map((t) => (
                <li key={t.id}>
                  <SwipeToDelete
                    open={openId === t.id}
                    onOpenChange={(open) => setOpenId(open ? t.id : null)}
                    onDelete={() => {
                      setOpenId(null);
                      onRequestDelete(t);
                    }}
                  >
                    <button type="button" className="row" onClick={() => onOpenDetail(t)}>
                      <span className="row__main">
                        {/* 日付 / メモ / 金額 の順(要件 6.2) */}
                        <span className="row__sub num">{formatMonthDayWeekday(t.date)}</span>
                        <span className="row__title">
                          {t.memo === '' ? category.label : t.memo}
                        </span>
                      </span>
                      <span className="row__amount num">{formatYen(t.amount)}</span>
                    </button>
                  </SwipeToDelete>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
