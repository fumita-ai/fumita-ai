import { describe, expect, it } from 'vitest';
import {
  formatAchievement,
  formatAmountInput,
  formatCalendarAmount,
  formatComma,
  formatRatio,
  formatSigned,
  formatYen,
  parseAmountInput,
} from './format';

describe('formatYen(要件 3.2)', () => {
  it('3 桁カンマ区切り + ¥', () => {
    expect(formatYen(300_000)).toBe('¥300,000');
    expect(formatYen(0)).toBe('¥0');
    expect(formatYen(1)).toBe('¥1');
    expect(formatYen(9_999_999)).toBe('¥9,999,999');
  });

  it('マイナスは「−」を先頭に付ける', () => {
    expect(formatYen(-1_200)).toBe('−¥1,200');
  });
});

describe('formatCalendarAmount(要件 7.1)', () => {
  it('10 万円未満はそのまま', () => {
    expect(formatCalendarAmount(-1_200)).toBe('-1,200');
    expect(formatCalendarAmount(99_999)).toBe('+99,999');
  });

  it('10 万円以上は「万」単位で小数点以下 1 桁(切り捨て)', () => {
    expect(formatCalendarAmount(-123_456)).toBe('-12.3万');
    expect(formatCalendarAmount(300_000)).toBe('+30.0万');
    expect(formatCalendarAmount(100_000)).toBe('+10.0万');
    expect(formatCalendarAmount(-199_999)).toBe('-19.9万');
  });
});

describe('formatSigned(カレンダーの日付見出し)', () => {
  it('短縮せずに符号付きで返す', () => {
    expect(formatSigned(-1_200)).toBe('-1,200');
    expect(formatSigned(300_000)).toBe('+300,000');
    expect(formatSigned(0)).toBe('+0');
  });
});

describe('formatRatio(要件 6.1: 小数点以下 2 桁、3 桁目以降は切り捨て)', () => {
  it('切り捨てになっている', () => {
    expect(formatRatio(1, 3)).toBe('33.33');
    expect(formatRatio(1, 6)).toBe('16.66');
    expect(formatRatio(2, 3)).toBe('66.66');
  });

  it('端の値', () => {
    expect(formatRatio(0, 1_000)).toBe('0.00');
    expect(formatRatio(1_000, 1_000)).toBe('100.00');
    expect(formatRatio(0, 0)).toBe('0.00');
  });
});

describe('formatAchievement(要件 8.2)', () => {
  it('小数点以下 1 桁、100% 超えも実数で表示', () => {
    expect(formatAchievement(120_000, 100_000)).toBe('120.0');
    expect(formatAchievement(50_000, 100_000)).toBe('50.0');
    expect(formatAchievement(33_333, 100_000)).toBe('33.3');
  });

  it('目標額が未設定(0)なら 0.0', () => {
    expect(formatAchievement(50_000, 0)).toBe('0.0');
  });

  it('貯金額がマイナスなら「−」付き', () => {
    expect(formatAchievement(-20_000, 100_000)).toBe('−20.0');
  });
});

describe('金額入力欄', () => {
  it('入力中も 3 桁カンマ区切り(要件 9.1)', () => {
    expect(formatAmountInput('1234')).toBe('1,234');
    expect(formatAmountInput('1,234')).toBe('1,234');
    expect(formatAmountInput('')).toBe('');
  });

  it('数字以外と先頭の 0 を取り除く', () => {
    expect(formatAmountInput('12a3')).toBe('123');
    expect(formatAmountInput('007')).toBe('7');
    expect(formatAmountInput('0')).toBe('0');
    expect(formatAmountInput('abc')).toBe('');
  });

  it('parseAmountInput', () => {
    expect(parseAmountInput('1,234')).toBe(1234);
    expect(parseAmountInput('')).toBe(0);
  });

  it('formatComma', () => {
    expect(formatComma(1_234_567)).toBe('1,234,567');
  });
});
