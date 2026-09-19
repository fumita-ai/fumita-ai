import { useMemo } from 'react';
import { computeSavings, fillRatio } from '../lib/calc';
import { formatAchievement, formatYen } from '../lib/format';
import type { DateStr } from '../lib/date';
import type { AppData } from '../types';
import { MilkBottle } from '../components/MilkBottle';
import { GearIcon } from '../components/icons';

/** 資産管理タブ(要件 8 章)。 */
export function AssetsScreen({
  data,
  today,
  playKey,
  onOpenSettings,
}: {
  data: AppData;
  today: DateStr;
  playKey: number;
  onOpenSettings: () => void;
}) {
  const { savingsGoal, initialSavings } = data.settings;

  const savings = useMemo(
    () => computeSavings(data.transactions, initialSavings, today),
    [data.transactions, initialSavings, today],
  );

  const goalUnset = savingsGoal <= 0;
  const ratio = fillRatio(savings, savingsGoal);

  return (
    <>
      <header className="hdr">
        <div className="hdr__actions">
          <button type="button" className="icon-btn" onClick={onOpenSettings}>
            <GearIcon />
            <span className="sr-only">設定</span>
          </button>
        </div>
        <div className="hdr__center">
          <span className="hdr__title">資産管理</span>
        </div>
      </header>

      <div className="scroll">
        <div className="assets">
          <MilkBottle ratio={ratio} playKey={playKey} />

          <div className="assets__stats">
            <div className="stat-row">
              <span className="stat-row__label">現在の貯金額</span>
              <span
                className={`stat-row__value num${savings < 0 ? ' stat-row__value--minus' : ''}`}
              >
                {formatYen(savings)}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-row__label">目標額</span>
              <span className="stat-row__value num">
                {goalUnset ? '未設定' : formatYen(savingsGoal)}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-row__label">達成率</span>
              <span className="stat-row__value num">
                {goalUnset ? '—' : `${formatAchievement(savings, savingsGoal)}%`}
              </span>
            </div>
          </div>

          {goalUnset && <p className="assets__note">設定から目標額を入力してください</p>}
        </div>
      </div>
    </>
  );
}
