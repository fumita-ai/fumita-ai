import { describe, expect, it } from 'vitest';
import {
  addDays,
  calendarGrid,
  calendarMonthDays,
  formatMonthDayWeekday,
  formatPeriodRange,
  formatPeriodTitle,
  isValidDateStr,
  lastConfirmedDate,
  monthPeriodOf,
  monthRange,
  periodOf,
  periodRange,
  shiftMonth,
  shiftPeriod,
  switchPeriodUnit,
  todayStr,
  yearPeriodOf,
  yearRange,
} from './date';

describe('monthRange(要件 3.1: 1 か月 = 前月 25 日〜当月 24 日)', () => {
  it('2026年9月 は 2026/8/25〜2026/9/24', () => {
    expect(monthRange(2026, 9)).toEqual({ start: '2026-08-25', end: '2026-09-24' });
  });

  it('1 月は前年 12 月 25 日から始まる', () => {
    expect(monthRange(2026, 1)).toEqual({ start: '2025-12-25', end: '2026-01-24' });
  });

  it('2 月(うるう年)も区切りは 25 日 / 24 日で固定', () => {
    expect(monthRange(2024, 3)).toEqual({ start: '2024-02-25', end: '2024-03-24' });
  });
});

describe('yearRange(要件 3.1: 1 年 = 前年 12 月 25 日〜当年 12 月 24 日)', () => {
  it('2026年 は 2025/12/25〜2026/12/24', () => {
    expect(yearRange(2026)).toEqual({ start: '2025-12-25', end: '2026-12-24' });
  });
});

describe('monthPeriodOf(その日が属する月期間)', () => {
  it.each([
    ['2026-08-24', 2026, 8],
    ['2026-08-25', 2026, 9],
    ['2026-09-24', 2026, 9],
    ['2026-09-25', 2026, 10],
    ['2026-12-25', 2027, 1],
    ['2026-01-01', 2026, 1],
  ])('%s → %i年%i月', (date, year, month) => {
    expect(monthPeriodOf(date)).toEqual({ unit: 'month', year, month });
  });

  it('要件 13: 8/25 の支出は 9 月、8/24 の支出は 8 月に集計される', () => {
    expect(monthPeriodOf('2026-08-25').month).toBe(9);
    expect(monthPeriodOf('2026-08-24').month).toBe(8);
  });
});

describe('yearPeriodOf(その日が属する年期間)', () => {
  it.each([
    ['2026-12-24', 2026],
    ['2026-12-25', 2027],
    ['2026-01-01', 2026],
  ])('%s → %i年', (date, year) => {
    expect(yearPeriodOf(date).year).toBe(year);
  });
});

describe('lastConfirmedDate(要件 8.1: 25 日を迎えた時点で前の期間が確定)', () => {
  it.each([
    ['2026-09-24', '2026-08-24'],
    ['2026-09-25', '2026-09-24'],
    ['2026-09-26', '2026-09-24'],
    ['2026-10-01', '2026-09-24'],
    ['2026-01-05', '2025-12-24'],
    ['2026-03-01', '2026-02-24'],
  ])('今日が %s なら確定境界は %s', (today, expected) => {
    expect(lastConfirmedDate(today)).toBe(expected);
  });
});

describe('shiftPeriod / switchPeriodUnit', () => {
  it('月期間を前後に移動する', () => {
    const p = { unit: 'month' as const, year: 2026, month: 1 };
    expect(shiftPeriod(p, -1)).toEqual({ unit: 'month', year: 2025, month: 12 });
    expect(shiftPeriod(p, 1)).toEqual({ unit: 'month', year: 2026, month: 2 });
    expect(shiftPeriod(p, 12)).toEqual({ unit: 'month', year: 2027, month: 1 });
  });

  it('年期間を前後に移動する', () => {
    expect(shiftPeriod({ unit: 'year', year: 2026, month: 12 }, -1).year).toBe(2025);
  });

  it('月 → 年 は、月期間の終了日が属する年期間になる', () => {
    // 2027年1月 = 2026/12/25〜2027/1/24。終了日 2027/1/24 は 2027 年期間。
    expect(switchPeriodUnit({ unit: 'month', year: 2027, month: 1 }, 'year')).toEqual({
      unit: 'year',
      year: 2027,
      month: 1,
    });
    expect(switchPeriodUnit({ unit: 'month', year: 2026, month: 9 }, 'year')).toEqual({
      unit: 'year',
      year: 2026,
      month: 9,
    });
  });

  it('年 → 月 に戻すと、切り替える前の月に戻る', () => {
    const month = { unit: 'month' as const, year: 2026, month: 9 };
    const year = switchPeriodUnit(month, 'year');
    expect(switchPeriodUnit(year, 'month')).toEqual(month);
  });

  it('年表示で移動してから月表示に戻すと、その年の同じ月になる', () => {
    const year = switchPeriodUnit({ unit: 'month', year: 2026, month: 9 }, 'year');
    const prevYear = shiftPeriod(year, -1);
    expect(switchPeriodUnit(prevYear, 'month')).toEqual({
      unit: 'month',
      year: 2025,
      month: 9,
    });
  });

  it('月表示に戻した期間は、もとの年期間の中に収まる', () => {
    for (const month of [1, 6, 12]) {
      const year = switchPeriodUnit({ unit: 'month', year: 2026, month }, 'year');
      const back = switchPeriodUnit(year, 'month');
      const yr = periodRange(year);
      const mr = periodRange(back);
      expect(mr.start >= yr.start && mr.end <= yr.end).toBe(true);
    }
  });

  it('同じ単位なら何も変えない', () => {
    const p = { unit: 'month' as const, year: 2026, month: 5 };
    expect(switchPeriodUnit(p, 'month')).toBe(p);
  });
});

describe('表示ラベル(要件 6.1)', () => {
  it('月表示', () => {
    const p = periodOf('2026-09-19', 'month');
    expect(formatPeriodTitle(p)).toBe('2026年9月');
    expect(formatPeriodRange(p)).toBe('8月25日〜9月24日');
  });

  it('年表示', () => {
    const p = periodOf('2026-09-19', 'year');
    expect(formatPeriodTitle(p)).toBe('2026年');
    expect(formatPeriodRange(p)).toBe('2025年12月25日〜2026年12月24日');
  });
});

describe('日付ユーティリティ', () => {
  it('formatMonthDayWeekday', () => {
    expect(formatMonthDayWeekday('2026-09-19')).toBe('9/19(土)');
  });

  it('addDays は月・年をまたぐ', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('shiftMonth', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ y: 2025, m: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ y: 2027, m: 1 });
    expect(shiftMonth(2026, 6, -18)).toEqual({ y: 2024, m: 12 });
  });

  it('isValidDateStr は存在しない日付を弾く', () => {
    expect(isValidDateStr('2026-09-19')).toBe(true);
    expect(isValidDateStr('2026-02-29')).toBe(false);
    expect(isValidDateStr('2024-02-29')).toBe(true);
    expect(isValidDateStr('2026-13-01')).toBe(false);
    expect(isValidDateStr('2026-9-1')).toBe(false);
    expect(isValidDateStr(20260919)).toBe(false);
  });

  it('todayStr は端末のローカル日付を返す', () => {
    expect(todayStr(new Date(2026, 8, 19, 23, 30))).toBe('2026-09-19');
    expect(todayStr(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
});

describe('カレンダー(要件 7.1: 通常の暦月・日曜始まり)', () => {
  it('月の日数ぶんの日付を返す', () => {
    expect(calendarMonthDays(2026, 9)).toHaveLength(30);
    expect(calendarMonthDays(2026, 2)).toHaveLength(28);
    expect(calendarMonthDays(2024, 2)).toHaveLength(29);
  });

  it('グリッドは 7 列で、先頭の空きマスは null', () => {
    const grid = calendarGrid(2026, 9); // 2026/9/1 は火曜
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(grid[0][0]).toBeNull();
    expect(grid[0][1]).toBeNull();
    expect(grid[0][2]).toBe('2026-09-01');
    expect(grid.flat().filter((d) => d !== null)).toHaveLength(30);
  });
});
