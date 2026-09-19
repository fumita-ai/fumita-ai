/** 要件定義書 4章「データモデル」に対応する型定義。 */

export type TransactionType = 'expense' | 'income';

/** 支出カテゴリ。要件 3.4 で固定の 6 種類。 */
export type CategoryId =
  | 'housing'
  | 'food'
  | 'clothing'
  | 'hobby'
  | 'daily'
  | 'other';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  /** 支出のみ必須、収入は null */
  category: CategoryId | null;
  /** 'YYYY-MM-DD'(支出日・収入日) */
  date: string;
  /** 任意、空文字可、最大 50 文字 */
  memo: string;
  /** ISO 8601(登録日時) */
  createdAt: string;
  /** ISO 8601(更新日時) */
  updatedAt: string;
};

export type Settings = {
  /** 貯金の目標額(円)。0 = 未設定 */
  savingsGoal: number;
  /** 初期貯金額(円) */
  initialSavings: number;
};

export type AppData = {
  version: number;
  transactions: Transaction[];
  settings: Settings;
};
