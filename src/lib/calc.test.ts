import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types';
import {
  computeSavings,
  fillRatio,
  filterByRange,
  groupByDate,
  sortByCreatedAsc,
  sortForCategoryDetail,
  sumByCategory,
  sumTotals,
} from './calc';
import { monthRange, yearRange } from './date';

let seq = 0;
function tx(part: Partial<Transaction> & Pick<Transaction, 'date' | 'amount'>): Transaction {
  seq += 1;
  const createdAt = part.createdAt ?? `2026-01-01T00:00:${String(seq).padStart(2, '0')}.000Z`;
  return {
    id: part.id ?? `t${seq}`,
    type: part.type ?? 'expense',
    amount: part.amount,
    category: part.type === 'income' ? null : (part.category ?? 'food'),
    date: part.date,
    memo: part.memo ?? '',
    createdAt,
    updatedAt: part.updatedAt ?? createdAt,
  };
}

describe('filterByRange(要件 3.1 の期間で切り出す)', () => {
  const list = [
    tx({ date: '2026-08-24', amount: 100 }),
    tx({ date: '2026-08-25', amount: 200 }),
    tx({ date: '2026-09-24', amount: 300 }),
    tx({ date: '2026-09-25', amount: 400 }),
  ];

  it('2026年9月 は 8/25〜9/24 の 2 件', () => {
    const got = filterByRange(list, monthRange(2026, 9)).map((t) => t.amount);
    expect(got).toEqual([200, 300]);
  });

  it('2026年8月 は 7/25〜8/24 の 1 件', () => {
    expect(filterByRange(list, monthRange(2026, 8)).map((t) => t.amount)).toEqual([100]);
  });

  it('年期間(2026年 = 2025/12/25〜2026/12/24)', () => {
    expect(filterByRange(list, yearRange(2026))).toHaveLength(4);
    expect(filterByRange(list, yearRange(2025))).toHaveLength(0);
  });
});

describe('sumTotals', () => {
  it('収入・支出・収支', () => {
    const list = [
      tx({ date: '2026-09-01', amount: 300_000, type: 'income' }),
      tx({ date: '2026-09-02', amount: 1_200 }),
      tx({ date: '2026-09-03', amount: 800 }),
    ];
    expect(sumTotals(list)).toEqual({ income: 300_000, expense: 2_000, balance: 298_000 });
  });

  it('収支はマイナスにもなる', () => {
    expect(sumTotals([tx({ date: '2026-09-02', amount: 5_000 })]).balance).toBe(-5_000);
  });

  it('0 件なら全部 0', () => {
    expect(sumTotals([])).toEqual({ income: 0, expense: 0, balance: 0 });
  });
});

describe('sumByCategory(要件 6.1)', () => {
  it('6 カテゴリすべてを固定の順番で返し、0 円のカテゴリも含む', () => {
    const got = sumByCategory([
      tx({ date: '2026-09-01', amount: 1_000, category: 'food' }),
      tx({ date: '2026-09-02', amount: 500, category: 'food' }),
      tx({ date: '2026-09-03', amount: 2_000, category: 'housing' }),
      tx({ date: '2026-09-04', amount: 300_000, type: 'income' }),
    ]);
    expect(got).toEqual([
      { id: 'housing', amount: 2_000 },
      { id: 'food', amount: 1_500 },
      { id: 'clothing', amount: 0 },
      { id: 'hobby', amount: 0 },
      { id: 'daily', amount: 0 },
      { id: 'other', amount: 0 },
    ]);
  });

  it('収入は集計に入らない', () => {
    const got = sumByCategory([tx({ date: '2026-09-01', amount: 999, type: 'income' })]);
    expect(got.every((c) => c.amount === 0)).toBe(true);
  });
});

describe('computeSavings(要件 8.1)', () => {
  const list = [
    // 2026年9月 期間(8/25〜9/24)
    tx({ date: '2026-08-25', amount: 300_000, type: 'income' }),
    tx({ date: '2026-09-24', amount: 100_000 }),
    // 2026年10月 期間(9/25〜10/24)
    tx({ date: '2026-09-25', amount: 50_000 }),
  ];

  it('9/24 時点では 8/25〜9/24 はまだ確定していない', () => {
    // 確定境界は 8/24。それ以前の履歴は無いので初期貯金額のみ。
    expect(computeSavings(list, 10_000, '2026-09-24')).toBe(10_000);
  });

  it('要件 13: 9/25 を迎えると 8/25〜9/24 の収支が加算される', () => {
    expect(computeSavings(list, 10_000, '2026-09-25')).toBe(10_000 + 300_000 - 100_000);
  });

  it('収支がマイナスの月は貯金額から差し引かれる', () => {
    const minus = [tx({ date: '2026-09-01', amount: 30_000 })];
    expect(computeSavings(minus, 10_000, '2026-09-25')).toBe(-20_000);
  });

  it('貯金額はマイナスのままにする', () => {
    expect(computeSavings([tx({ date: '2026-01-05', amount: 5_000 })], 0, '2026-09-25')).toBe(-5_000);
  });

  it('未来日付の履歴は確定境界を越えないので加算されない', () => {
    const future = [tx({ date: '2027-01-01', amount: 1_000_000, type: 'income' })];
    expect(computeSavings(future, 0, '2026-09-25')).toBe(0);
  });

  it('初期貯金額のみでも計算できる', () => {
    expect(computeSavings([], 123_456, '2026-09-25')).toBe(123_456);
  });
});

describe('fillRatio(瓶の中身の高さ)', () => {
  it('0〜1 に収める', () => {
    expect(fillRatio(50_000, 100_000)).toBe(0.5);
    expect(fillRatio(150_000, 100_000)).toBe(1);
    expect(fillRatio(-10_000, 100_000)).toBe(0);
    expect(fillRatio(50_000, 0)).toBe(0);
  });
});

describe('並び替え', () => {
  it('支出詳細は支出日の降順、同日内は登録日時の降順(要件 6.2)', () => {
    const a = tx({ id: 'a', date: '2026-09-01', amount: 1, createdAt: '2026-09-01T10:00:00.000Z' });
    const b = tx({ id: 'b', date: '2026-09-01', amount: 2, createdAt: '2026-09-01T12:00:00.000Z' });
    const c = tx({ id: 'c', date: '2026-09-05', amount: 3, createdAt: '2026-09-05T09:00:00.000Z' });
    expect(sortForCategoryDetail([a, b, c]).map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });

  it('カレンダーの日毎リストは登録日時の昇順(要件 7.1)', () => {
    const a = tx({ id: 'a', date: '2026-09-01', amount: 1, createdAt: '2026-09-01T12:00:00.000Z' });
    const b = tx({ id: 'b', date: '2026-09-01', amount: 2, createdAt: '2026-09-01T09:00:00.000Z' });
    expect(sortByCreatedAsc([a, b]).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('並び替えは元の配列を壊さない', () => {
    const list = [tx({ date: '2026-09-02', amount: 1 }), tx({ date: '2026-09-01', amount: 2 })];
    const copy = [...list];
    sortForCategoryDetail(list);
    sortByCreatedAsc(list);
    expect(list).toEqual(copy);
  });
});

describe('groupByDate', () => {
  it('日付ごとにまとめる', () => {
    const map = groupByDate([
      tx({ date: '2026-09-01', amount: 1 }),
      tx({ date: '2026-09-01', amount: 2 }),
      tx({ date: '2026-09-02', amount: 3 }),
    ]);
    expect(map.get('2026-09-01')).toHaveLength(2);
    expect(map.get('2026-09-02')).toHaveLength(1);
    expect(map.get('2026-09-03')).toBeUndefined();
  });
});
