import { describe, expect, it } from 'vitest';
import { backupFileName, emptyAppData, parseAppData, parseAppDataJson } from './storage';
import type { AppData } from '../types';

const valid: AppData = {
  version: 1,
  transactions: [
    {
      id: 'a',
      type: 'expense',
      amount: 1_200,
      category: 'food',
      date: '2026-09-19',
      memo: 'ランチ',
      createdAt: '2026-09-19T03:00:00.000Z',
      updatedAt: '2026-09-19T03:00:00.000Z',
    },
    {
      id: 'b',
      type: 'income',
      amount: 300_000,
      category: null,
      date: '2026-08-25',
      memo: '',
      createdAt: '2026-08-25T00:00:00.000Z',
      updatedAt: '2026-08-25T00:00:00.000Z',
    },
  ],
  settings: { savingsGoal: 1_000_000, initialSavings: 50_000 },
};

const withTx = (patch: Record<string, unknown>) => ({
  ...valid,
  transactions: [{ ...valid.transactions[0], ...patch }],
});

describe('parseAppData(要件 11: 不正な形式は読み込まない)', () => {
  it('正しいデータはそのまま通る', () => {
    expect(parseAppData(structuredClone(valid))).toEqual(valid);
  });

  it('空のデータも通る', () => {
    expect(parseAppData(emptyAppData())).toEqual(emptyAppData());
  });

  it.each([
    ['null', null],
    ['配列', []],
    ['文字列', 'x'],
    ['version 欠落', { transactions: [], settings: { savingsGoal: 0, initialSavings: 0 } }],
    ['transactions 欠落', { version: 1, settings: { savingsGoal: 0, initialSavings: 0 } }],
    ['settings 欠落', { version: 1, transactions: [] }],
    ['未来のバージョン', { ...valid, version: 99 }],
  ])('%s は拒否する', (_label, input) => {
    expect(parseAppData(input)).toBeNull();
  });

  it.each([
    ['金額が 0', withTx({ amount: 0 })],
    ['金額が上限超え', withTx({ amount: 10_000_000 })],
    ['金額が小数', withTx({ amount: 1.5 })],
    ['金額が文字列', withTx({ amount: '1200' })],
    ['存在しない日付', withTx({ date: '2026-02-30' })],
    ['日付の形式違い', withTx({ date: '2026/09/19' })],
    ['未知のカテゴリ', withTx({ category: 'travel' })],
    ['支出なのにカテゴリが null', withTx({ category: null })],
    ['収入なのにカテゴリあり', withTx({ type: 'income', category: 'food' })],
    ['未知の種別', withTx({ type: 'transfer' })],
    ['メモが 51 文字', withTx({ memo: 'あ'.repeat(51) })],
    ['id が空', withTx({ id: '' })],
  ])('履歴が壊れている(%s)なら全体を拒否する', (_label, input) => {
    expect(parseAppData(input)).toBeNull();
  });

  it('id の重複を拒否する', () => {
    const dup = { ...valid, transactions: [valid.transactions[0], { ...valid.transactions[0] }] };
    expect(parseAppData(dup)).toBeNull();
  });

  it.each([
    ['目標額がマイナス', { savingsGoal: -1, initialSavings: 0 }],
    ['目標額が上限超え', { savingsGoal: 100_000_000, initialSavings: 0 }],
    ['初期貯金額が文字列', { savingsGoal: 0, initialSavings: '0' }],
  ])('設定が不正(%s)なら拒否する', (_label, settings) => {
    expect(parseAppData({ ...valid, settings })).toBeNull();
  });

  it('メモは 50 文字ちょうどまで許す', () => {
    expect(parseAppData(withTx({ memo: 'あ'.repeat(50) }))).not.toBeNull();
  });

  it('余分なキーは無視して取り込む', () => {
    const result = parseAppData({ ...valid, extra: 1, transactions: [{ ...valid.transactions[0], extra: 1 }] });
    expect(result?.transactions[0]).toEqual(valid.transactions[0]);
  });
});

describe('parseAppDataJson', () => {
  it('書き出した JSON を読み込むと完全に復元される(要件 13)', () => {
    expect(parseAppDataJson(JSON.stringify(valid))).toEqual(valid);
  });

  it('JSON として壊れていれば null', () => {
    expect(parseAppDataJson('{')).toBeNull();
    expect(parseAppDataJson('')).toBeNull();
  });
});

describe('backupFileName(要件 11)', () => {
  it('kakeibo-backup-YYYYMMDD.json', () => {
    expect(backupFileName('2026-09-19')).toBe('kakeibo-backup-20260919.json');
  });
});
