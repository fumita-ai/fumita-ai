import { useMemo, useRef, useState } from 'react';
import { CATEGORY_MAP } from '../constants';
import { groupByDate, sortByCreatedAsc, sumTotals } from '../lib/calc';
import {
  calendarGrid,
  calendarMonthDays,
  formatMonthDayWeekday,
  parseDateStr,
  shiftMonth,
  WEEKDAY_JA,
  type DateStr,
} from '../lib/date';
import { formatCalendarAmount, formatSigned, formatYen } from '../lib/format';
import type { Transaction } from '../types';
import { CategoryBadge } from '../components/CategoryBadge';
import { SwipeToDelete } from '../components/SwipeToDelete';
import { ChevronLeft, ChevronRight, GearIcon } from '../components/icons';

type CalendarMonth = { year: number; month: number };

/** カレンダータブ(要件 7 章)。通常の暦月で表示する。 */
export function CalendarScreen({
  transactions,
  today,
  month,
  onMonthChange,
  onOpenDetail,
  onRequestDelete,
  onOpenSettings,
}: {
  transactions: Transaction[];
  today: DateStr;
  month: CalendarMonth;
  onMonthChange: (m: CalendarMonth) => void;
  onOpenDetail: (t: Transaction) => void;
  onRequestDelete: (t: Transaction) => void;
  onOpenSettings: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headingRefs = useRef(new Map<DateStr, HTMLElement>());

  const { byDate, totalsByDate, listDays } = useMemo(() => {
    const monthDays = calendarMonthDays(month.year, month.month);
    const inMonth = transactions.filter(
      (t) => t.date >= monthDays[0] && t.date <= monthDays[monthDays.length - 1],
    );
    const grouped = groupByDate(inMonth);
    const totals = new Map(
      [...grouped].map(([date, list]) => [date, sumTotals(list)] as const),
    );
    return {
      byDate: grouped,
      totalsByDate: totals,
      // 履歴のない日は見出しごと表示しない(要件 7.1)。
      listDays: monthDays.filter((d) => grouped.has(d)),
    };
  }, [transactions, month]);

  const grid = useMemo(() => calendarGrid(month.year, month.month), [month]);

  const scrollToDay = (date: DateStr) => {
    const el = headingRefs.current.get(date);
    const container = scrollRef.current;
    if (el === undefined || container === null) return;
    container.scrollTo({ top: el.offsetTop - container.offsetTop, behavior: 'smooth' });
  };

  const shift = (delta: number) => {
    const { y, m } = shiftMonth(month.year, month.month, delta);
    onMonthChange({ year: y, month: m });
  };

  return (
    <>
      <header className="hdr">
        <div className="hdr__actions">
          <button type="button" className="icon-btn" onClick={onOpenSettings}>
            <GearIcon />
            <span className="sr-only">設定</span>
          </button>
        </div>
        <div className="hdr__center">
          <div className="hdr__nav">
            <button type="button" className="icon-btn icon-btn--sm" onClick={() => shift(-1)}>
              <ChevronLeft />
              <span className="sr-only">前の月</span>
            </button>
            <span className="hdr__title num">
              {month.year}年{month.month}月
            </span>
            <button type="button" className="icon-btn icon-btn--sm" onClick={() => shift(1)}>
              <ChevronRight />
              <span className="sr-only">次の月</span>
            </button>
          </div>
        </div>
      </header>

      <div className="cal">
        <div className="cal__weekdays">
          {WEEKDAY_JA.map((w, i) => (
            <span
              key={w}
              className={`cal__weekday${i === 0 ? ' cal__weekday--sun' : ''}${i === 6 ? ' cal__weekday--sat' : ''}`}
            >
              {w}
            </span>
          ))}
        </div>
        <div className="cal__grid">
          {grid.flat().map((date, i) => {
            if (date === null) {
              return <span key={`empty-${i}`} className="cal__cell cal__cell--empty" />;
            }
            const totals = totalsByDate.get(date);
            const isToday = date === today;
            return (
              <button
                key={date}
                type="button"
                className={`cal__cell${isToday ? ' cal__cell--today' : ''}`}
                onClick={() => scrollToDay(date)}
                aria-label={formatMonthDayWeekday(date)}
              >
                <span className="cal__daynum num">{parseDateStr(date).d}</span>
                {totals !== undefined && totals.expense > 0 && (
                  <span className="cal__amt cal__amt--expense num">
                    {formatCalendarAmount(-totals.expense)}
                  </span>
                )}
                {totals !== undefined && totals.income > 0 && (
                  <span className="cal__amt cal__amt--income num">
                    {formatCalendarAmount(totals.income)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="scroll scroll--padded" ref={scrollRef}>
        {listDays.length === 0 ? (
          <p className="empty">この月の記録はありません</p>
        ) : (
          listDays.map((date) => {
            const list = sortByCreatedAsc(byDate.get(date) ?? []);
            const totals = totalsByDate.get(date) ?? { income: 0, expense: 0, balance: 0 };
            return (
              <section key={date}>
                <h3
                  className="daylist__heading"
                  ref={(el) => {
                    if (el === null) headingRefs.current.delete(date);
                    else headingRefs.current.set(date, el);
                  }}
                >
                  <span className="num">{formatMonthDayWeekday(date)}</span>
                  <span className="daylist__totals num">
                    <span>支出 {formatSigned(-totals.expense)}</span>
                    <span>収入 {formatSigned(totals.income)}</span>
                  </span>
                </h3>
                <ul className="card" style={{ marginTop: 0 }}>
                  {list.map((t) => {
                    const isExpense = t.type === 'expense';
                    const fallbackLabel =
                      isExpense && t.category !== null ? CATEGORY_MAP[t.category].label : '収入';
                    return (
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
                            <CategoryBadge id={isExpense ? t.category : null} size={28} />
                            <span className="row__main">
                              <span className="row__title">
                                {t.memo === '' ? fallbackLabel : t.memo}
                              </span>
                            </span>
                            <span
                              className="row__amount num"
                              style={{ color: isExpense ? 'var(--expense)' : 'var(--income)' }}
                            >
                              {isExpense ? '−' : '+'}
                              {formatYen(t.amount)}
                            </span>
                          </button>
                        </SwipeToDelete>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
