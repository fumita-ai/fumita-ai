import type { CategoryId } from './types';

export type CategoryDef = {
  id: CategoryId;
  label: string;
  color: string;
};

/** 要件 3.4 の並び順どおりに扱う。 */
export const CATEGORIES: readonly CategoryDef[] = [
  { id: 'housing', label: '住宅', color: '#4E9A78' },
  { id: 'food', label: '食費', color: '#D65A5A' },
  { id: 'clothing', label: '衣服', color: '#F2B25C' },
  { id: 'hobby', label: '趣味', color: '#E0628F' },
  { id: 'daily', label: '日用品', color: '#8CC98A' },
  { id: 'other', label: 'その他', color: '#5BA8D6' },
] as const;

export const CATEGORY_MAP: Record<CategoryId, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryDef>;

/** 履歴の金額(要件 3.2) */
export const AMOUNT_MIN = 1;
export const AMOUNT_MAX = 9_999_999;

/** 設定画面の貯金額(目標額・初期貯金額)。0 は「未設定 / 0 円」を意味する。 */
export const SAVINGS_MIN = 0;
export const SAVINGS_MAX = 99_999_999;

export const MEMO_MAX_LENGTH = 50;

export const DATA_VERSION = 1;

export const STORAGE_KEY = 'kakeibo:appData';
