import { useMemo } from 'react';
import { CATEGORY_MAP } from '../constants';
import { filterByRange, sumByCategory, sumTotals } from '../lib/calc';
import {
  formatPeriodRange,
  formatPeriodTitle,
  periodRange,
  shiftPeriod,
  switchPeriodUnit,
  type Period,
} from '../lib/date';
import { formatRatio, formatYen } from '../lib/format';
import type { CategoryId, Transaction } from '../types';
import { CategoryBadge } from '../components/CategoryBadge';
import { DonutChart } from '../components/DonutChart';
import { ChevronLeft, ChevronRight, GearIcon, MonthYearIcon } from '../components/icons';

/** 支出管理タブ(要件 6.1)。 */
export function ExpenseScreen({
  transactions,
  period,
  onPeriodChange,
  onOpenCategory,
  onOpenSettings,
}: {
  transactions: Transaction[];
  period: Period;
  onPeriodChange: (p: Period) => void;
  onOpenCategory: (id: CategoryId) => void;
  onOpenSettings: () => void;
}) {
  const { totals, byCategory } = useMemo(() => {
    const inPeriod = filterByRange(transactions, periodRange(period));
    return { totals: sumTotals(inPeriod), byCategory: sumByCategory(inPeriod) };
  }, [transactions, period]);

  const nextUnit = period.unit === 'month' ? 'year' : 'month';

  return (
    <>
      <header className="hdr">
        <div className="hdr__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onPeriodChange(switchPeriodUnit(period, nextUnit))}
          >
            <MonthYearIcon unit={period.unit} />
            <span className="sr-only">
              {nextUnit === 'year' ? '年表示に切り替え' : '月表示に切り替え'}
            </span>
          </button>
          <button type="button" className="icon-btn" onClick={onOpenSettings}>
            <GearIcon />
            <span className="sr-only">設定</span>
          </button>
        </div>
        <div className="hdr__center">
          <div className="hdr__nav">
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              onClick={() => onPeriodChange(shiftPeriod(period, -1))}
            >
              <ChevronLeft />
              <span className="sr-only">前の期間</span>
            </button>
            <span className="hdr__title num">{formatPeriodTitle(period)}</span>
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              onClick={() => onPeriodChange(shiftPeriod(period, 1))}
            >
              <ChevronRight />
              <span className="sr-only">次の期間</span>
            </button>
          </div>
          <span className="hdr__sub num">（{formatPeriodRange(period)}）</span>
        </div>
      </header>

      <div className="scroll scroll--padded">
        <section className="card">
          <div className="summary">
            <div className="summary__chart">
              <DonutChart slices={byCategory} total={totals.expense} />
            </div>
            <div className="summary__totals">
              <div className="total-line">
                <span className="total-line__label">収入</span>
                <span className="total-line__value num">{formatYen(totals.income)}</span>
              </div>
              <div className="total-line">
                <span className="total-line__label">支出</span>
                <span className="total-line__value num">{formatYen(totals.expense)}</span>
              </div>
              <div className="total-line total-line--balance">
                <span className="total-line__label">収支</span>
                <span
                  className={`total-line__value num${totals.balance < 0 ? ' total-line__value--minus' : ''}`}
                >
                  {formatYen(totals.balance)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <h2 className="section-title">カテゴリ別</h2>
        <section className="card">
          <ul>
            {byCategory.map((c) => (
              <li key={c.id}>
                <button type="button" className="row" onClick={() => onOpenCategory(c.id)}>
                  <CategoryBadge id={c.id} />
                  <span className="row__main">
                    <span className="row__title">{CATEGORY_MAP[c.id].label}</span>
                  </span>
                  <span className="row__amount num">{formatYen(c.amount)}</span>
                  <span className="cat-row__ratio num">
                    {formatRatio(c.amount, totals.expense)}%
                  </span>
                  <ChevronRight className="row__chev" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
