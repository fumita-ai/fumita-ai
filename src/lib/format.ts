/** 金額・割合の表示フォーマット(要件 3.2 / 6.1 / 7.1 / 8.2)。 */

/** マイナス記号は全角相当の U+2212(要件の表記に合わせる)。 */
const MINUS = '−';

export function formatComma(n: number): string {
  return Math.abs(Math.trunc(n)).toLocaleString('en-US');
}

/** 例: ¥300,000 / −¥1,200 */
export function formatYen(n: number): string {
  const sign = n < 0 ? MINUS : '';
  return `${sign}¥${formatComma(n)}`;
}

/** 符号付き・カンマ区切り(短縮なし)。例: +300,000 / -1,200 / +0 */
export function formatSigned(n: number): string {
  return `${n < 0 ? '-' : '+'}${formatComma(n)}`;
}

/**
 * カレンダーのマス用。符号付きで ¥ なし。
 * 絶対値が 10 万以上のときは「万」単位・小数点以下 1 桁(切り捨て)に短縮する。
 * 例: -1,200 / +300,000 → +30.0万 / -123,456 → -12.3万
 */
export function formatCalendarAmount(n: number): string {
  const sign = n < 0 ? '-' : '+';
  const abs = Math.abs(Math.trunc(n));
  if (abs >= 100_000) {
    const man = Math.floor(abs / 1_000) / 10;
    return `${sign}${man.toFixed(1)}万`;
  }
  return `${sign}${formatComma(abs)}`;
}

/**
 * 支出全体に占める割合。小数点以下 2 桁、3 桁目以降は切り捨て(要件 6.1)。
 * 例: 1/3 → '33.33'、1/6 → '16.66'
 */
export function formatRatio(value: number, total: number): string {
  if (total <= 0) return '0.00';
  return (Math.floor((value / total) * 10_000) / 100).toFixed(2);
}

/**
 * 貯金の達成率。小数点以下 1 桁、2 桁目以降は切り捨て(要件 8.2)。
 * 目標額が未設定(0)のときは 0 を返す。
 */
export function formatAchievement(savings: number, goal: number): string {
  if (goal <= 0) return '0.0';
  const raw = (savings / goal) * 100;
  const truncated = Math.floor(Math.abs(raw) * 10) / 10;
  return `${raw < 0 ? MINUS : ''}${truncated.toFixed(1)}`;
}

/** 入力中の金額欄に表示する 3 桁カンマ区切り。数字以外は取り除く。 */
export function formatAmountInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
  if (digits === '') return '';
  return Number(digits).toLocaleString('en-US');
}

export function parseAmountInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  return digits === '' ? 0 : Number(digits);
}
