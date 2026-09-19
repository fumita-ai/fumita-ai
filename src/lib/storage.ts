/** localStorage への保存と、書き出し / 読み込み用の検証(要件 2.2 / 11 章)。 */

import { AMOUNT_MAX, AMOUNT_MIN, CATEGORIES, DATA_VERSION, MEMO_MAX_LENGTH, SAVINGS_MAX, STORAGE_KEY } from '../constants';
import type { AppData, CategoryId, Settings, Transaction } from '../types';
import { isValidDateStr } from './date';

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));

export function emptyAppData(): AppData {
  return {
    version: DATA_VERSION,
    transactions: [],
    settings: { savingsGoal: 0, initialSavings: 0 },
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isIntInRange = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

function parseTransaction(raw: unknown): Transaction | null {
  if (!isRecord(raw)) return null;
  const { id, type, amount, category, date, memo, createdAt, updatedAt } = raw;

  if (typeof id !== 'string' || id === '') return null;
  if (type !== 'expense' && type !== 'income') return null;
  if (!isIntInRange(amount, AMOUNT_MIN, AMOUNT_MAX)) return null;
  if (!isValidDateStr(date)) return null;
  if (typeof memo !== 'string' || memo.length > MEMO_MAX_LENGTH) return null;
  if (typeof createdAt !== 'string' || typeof updatedAt !== 'string') return null;

  let parsedCategory: CategoryId | null;
  if (type === 'expense') {
    if (typeof category !== 'string' || !CATEGORY_IDS.has(category)) return null;
    parsedCategory = category as CategoryId;
  } else {
    if (category !== null && category !== undefined) return null;
    parsedCategory = null;
  }

  return { id, type, amount, category: parsedCategory, date, memo, createdAt, updatedAt };
}

function parseSettings(raw: unknown): Settings | null {
  if (!isRecord(raw)) return null;
  const { savingsGoal, initialSavings } = raw;
  if (!isIntInRange(savingsGoal, 0, SAVINGS_MAX)) return null;
  if (!isIntInRange(initialSavings, 0, SAVINGS_MAX)) return null;
  return { savingsGoal, initialSavings };
}

/**
 * 未知の値を AppData として検証する。1 件でも壊れた履歴があれば読み込みを失敗させ、
 * 既存データを壊さない(要件 11 章)。
 */
export function parseAppData(raw: unknown): AppData | null {
  if (!isRecord(raw)) return null;
  if (!isIntInRange(raw.version, 1, Number.MAX_SAFE_INTEGER)) return null;
  if (raw.version > DATA_VERSION) return null;
  if (!Array.isArray(raw.transactions)) return null;

  const settings = parseSettings(raw.settings);
  if (settings === null) return null;

  const transactions: Transaction[] = [];
  const seen = new Set<string>();
  for (const item of raw.transactions) {
    const t = parseTransaction(item);
    if (t === null || seen.has(t.id)) return null;
    seen.add(t.id);
    transactions.push(t);
  }

  return { version: DATA_VERSION, transactions, settings };
}

export function parseAppDataJson(text: string): AppData | null {
  try {
    return parseAppData(JSON.parse(text));
  } catch {
    return null;
  }
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return emptyAppData();
    return parseAppDataJson(raw) ?? emptyAppData();
  } catch {
    return emptyAppData();
  }
}

export function saveAppData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** ファイル名例: kakeibo-backup-20260919.json */
export function backupFileName(today: string): string {
  return `kakeibo-backup-${today.replace(/-/g, '')}.json`;
}
