/** 履歴の集計(要件 6 章・7 章・8 章)。 */

import type { CategoryId, Transaction } from '../types';
import { CATEGORIES } from '../constants';
import type { DateRange, DateStr } from './date';
import { lastConfirmedDate } from './date';

export function isInRange(date: DateStr, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

export function filterByRange(transactions: Transaction[], range: DateRange): Transaction[] {
  return transactions.filter((t) => isInRange(t.date, range));
}

export type Totals = { income: number; expense: number; balance: number };

export function sumTotals(transactions: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

/** 6 カテゴリすべてを要件 3.4 の順番で返す(支出 0 円のカテゴリも含む)。 */
export function sumByCategory(transactions: Transaction[]): { id: CategoryId; amount: number }[] {
  const totals = new Map<CategoryId, number>(CATEGORIES.map((c) => [c.id, 0]));
  for (const t of transactions) {
    if (t.type !== 'expense' || t.category === null) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  return CATEGORIES.map((c) => ({ id: c.id, amount: totals.get(c.id) ?? 0 }));
}

/**
 * 貯金額 = 初期貯金額 + 確定済みの各月の収支の合計(要件 8.1)。
 *
 * 確定済みの範囲は「直近で過ぎた 24 日」以前のすべての履歴。各月の収支を足し合わせた
 * ものと、その範囲の収入合計 − 支出合計は一致するため、まとめて計算する。
 * 保存はせず、呼び出しのたびに履歴から計算する。
 */
export function computeSavings(
  transactions: Transaction[],
  initialSavings: number,
  today: DateStr,
): number {
  const cutoff = lastConfirmedDate(today);
  let sum = initialSavings;
  for (const t of transactions) {
    if (t.date > cutoff) continue;
    sum += t.type === 'income' ? t.amount : -t.amount;
  }
  return sum;
}

/** 達成率を 0〜1 に丸めた値(瓶の中身の高さに使う)。 */
export function fillRatio(savings: number, goal: number): number {
  if (goal <= 0 || savings <= 0) return 0;
  return Math.min(1, savings / goal);
}

/** 支出日の降順、同日内は登録日時の降順(要件 6.2)。 */
export function sortForCategoryDetail(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

/** 登録日時の昇順(カレンダータブの日毎リスト、要件 7.1)。 */
export function sortByCreatedAsc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** 日付ごとにまとめる(キーは 'YYYY-MM-DD')。 */
export function groupByDate(transactions: Transaction[]): Map<DateStr, Transaction[]> {
  const map = new Map<DateStr, Transaction[]>();
  for (const t of transactions) {
    const list = map.get(t.date);
    if (list) list.push(t);
    else map.set(t.date, [t]);
  }
  return map;
}
