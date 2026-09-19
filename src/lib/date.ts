/**
 * 日付と集計期間のユーティリティ。
 *
 * 要件 3.1:
 *  - 1 か月 = 前月 25 日 〜 当月 24 日(給料日基準)
 *  - 1 年   = 前年 12 月 25 日 〜 当年 12 月 24 日
 *  - カレンダータブのみ通常の暦月
 *
 * 日付は 'YYYY-MM-DD' の固定長文字列で扱う。固定長なので辞書順比較がそのまま
 * 日付の前後比較になり、タイムゾーンの影響を受けない。
 */

/** 'YYYY-MM-DD' */
export type DateStr = string;

export type YMD = { y: number; m: number; d: number };

const pad2 = (n: number) => String(n).padStart(2, '0');

export function toDateStr(y: number, m: number, d: number): DateStr {
  return `${String(y).padStart(4, '0')}-${pad2(m)}-${pad2(d)}`;
}

export function parseDateStr(s: DateStr): YMD {
  return {
    y: Number(s.slice(0, 4)),
    m: Number(s.slice(5, 7)),
    d: Number(s.slice(8, 10)),
  };
}

export function isValidDateStr(s: unknown): s is DateStr {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const { y, m, d } = parseDateStr(s);
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth(y, m);
}

/** 端末のローカル日付(要件 3.3)。 */
export function todayStr(now: Date = new Date()): DateStr {
  return toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/** 月を delta か月ずらす(日は持たない)。 */
export function shiftMonth(y: number, m: number, delta: number): { y: number; m: number } {
  const zero = y * 12 + (m - 1) + delta;
  return { y: Math.floor(zero / 12), m: (((zero % 12) + 12) % 12) + 1 };
}

/** 日付に日数を加算した 'YYYY-MM-DD' を返す。 */
export function addDays(s: DateStr, days: number): DateStr {
  const { y, m, d } = parseDateStr(s);
  const dt = new Date(y, m - 1, d + days);
  return toDateStr(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

/** 0=日 〜 6=土 */
export function dayOfWeek(s: DateStr): number {
  const { y, m, d } = parseDateStr(s);
  return new Date(y, m - 1, d).getDay();
}

export const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 例: '9/19(土)' */
export function formatMonthDayWeekday(s: DateStr): string {
  const { m, d } = parseDateStr(s);
  return `${m}/${d}(${WEEKDAY_JA[dayOfWeek(s)]})`;
}

// ---------------------------------------------------------------------------
// 集計期間
// ---------------------------------------------------------------------------

export type PeriodUnit = 'month' | 'year';

/**
 * 表示中の集計期間。`unit === 'month'` のとき `month` を使い、
 * `unit === 'year'` のとき `month` は無視する。
 */
export type Period = { unit: PeriodUnit; year: number; month: number };

export type DateRange = { start: DateStr; end: DateStr };

/** 「YYYY 年 M 月」= 前月 25 日 〜 当月 24 日 */
export function monthRange(year: number, month: number): DateRange {
  const prev = shiftMonth(year, month, -1);
  return { start: toDateStr(prev.y, prev.m, 25), end: toDateStr(year, month, 24) };
}

/** 「YYYY 年」= 前年 12 月 25 日 〜 当年 12 月 24 日 */
export function yearRange(year: number): DateRange {
  return { start: toDateStr(year - 1, 12, 25), end: toDateStr(year, 12, 24) };
}

export function periodRange(p: Period): DateRange {
  return p.unit === 'month' ? monthRange(p.year, p.month) : yearRange(p.year);
}

/** 指定日を含む「月」期間。25 日以降は翌月の期間に属する。 */
export function monthPeriodOf(date: DateStr): Period {
  const { y, m, d } = parseDateStr(date);
  const target = d >= 25 ? shiftMonth(y, m, 1) : { y, m };
  return { unit: 'month', year: target.y, month: target.m };
}

/** 指定日を含む「年」期間。12/25 以降は翌年の期間に属する。 */
export function yearPeriodOf(date: DateStr): Period {
  const { y, m, d } = parseDateStr(date);
  const year = m === 12 && d >= 25 ? y + 1 : y;
  return { unit: 'year', year, month: 12 };
}

/** 表示単位を保ったまま、指定日を含む期間へ。 */
export function periodOf(date: DateStr, unit: PeriodUnit): Period {
  return unit === 'month' ? monthPeriodOf(date) : yearPeriodOf(date);
}

/** 期間を前後に移動する。 */
export function shiftPeriod(p: Period, delta: number): Period {
  if (p.unit === 'year') return { ...p, year: p.year + delta };
  const { y, m } = shiftMonth(p.year, p.month, delta);
  return { unit: 'month', year: y, month: m };
}

/**
 * 表示単位を切り替える。
 * 月は Period に保持したままにするので、年表示から月表示に戻すと元の月に戻る。
 */
export function switchPeriodUnit(p: Period, unit: PeriodUnit): Period {
  if (p.unit === unit) return p;
  if (unit === 'year') {
    return { unit: 'year', year: yearPeriodOf(periodRange(p).end).year, month: p.month };
  }
  return { unit: 'month', year: p.year, month: p.month };
}

/** ヘッダー中央のラベル。例: '2026年9月' / '2026年' */
export function formatPeriodTitle(p: Period): string {
  return p.unit === 'month' ? `${p.year}年${p.month}月` : `${p.year}年`;
}

/** ヘッダー下の対象期間。例: '8月25日〜9月24日' / '2025年12月25日〜2026年12月24日' */
export function formatPeriodRange(p: Period): string {
  const { start, end } = periodRange(p);
  const s = parseDateStr(start);
  const e = parseDateStr(end);
  if (p.unit === 'month') return `${s.m}月${s.d}日〜${e.m}月${e.d}日`;
  return `${s.y}年${s.m}月${s.d}日〜${e.y}年${e.m}月${e.d}日`;
}

/**
 * 「直近で過ぎた 24 日」。この日以前の履歴が貯金額として確定する(要件 8.1)。
 * 25 日を迎えた時点で前の期間が確定するため、当日が 24 日のときはまだ確定しない。
 */
export function lastConfirmedDate(today: DateStr): DateStr {
  const { y, m, d } = parseDateStr(today);
  if (d > 24) return toDateStr(y, m, 24);
  const prev = shiftMonth(y, m, -1);
  return toDateStr(prev.y, prev.m, 24);
}

// ---------------------------------------------------------------------------
// カレンダー(通常の暦月)
// ---------------------------------------------------------------------------

/** 暦月の 1 日〜月末の日付一覧。 */
export function calendarMonthDays(year: number, month: number): DateStr[] {
  const last = daysInMonth(year, month);
  return Array.from({ length: last }, (_, i) => toDateStr(year, month, i + 1));
}

/**
 * 日曜始まりの 7 列グリッド。月に属さないマスは null。
 * 週数は月によって 4〜6 週になる。
 */
export function calendarGrid(year: number, month: number): (DateStr | null)[][] {
  const days = calendarMonthDays(year, month);
  const leading = dayOfWeek(days[0]);
  const cells: (DateStr | null)[] = [...Array<null>(leading).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (DateStr | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
