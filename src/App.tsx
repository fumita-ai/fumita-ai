import { useCallback, useEffect, useMemo, useState } from 'react';
import { CATEGORY_MAP } from './constants';
import { periodOf, todayStr, type DateStr, type Period } from './lib/date';
import { useStore, type NewTransaction } from './store';
import type { CategoryId, Transaction } from './types';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DetailSheet } from './components/DetailSheet';
import { TransactionSheet, type TransactionSheetMode } from './components/TransactionSheet';
import { BottleTabIcon, CalendarTabIcon, ChartTabIcon, PlusIcon } from './components/icons';
import { AssetsScreen } from './screens/AssetsScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { CategoryDetailScreen } from './screens/CategoryDetailScreen';
import { ExpenseScreen } from './screens/ExpenseScreen';
import { SettingsScreen } from './screens/SettingsScreen';

type Tab = 'expense' | 'calendar' | 'assets';

const TABS: { id: Tab; label: string; Icon: (p: { className?: string }) => React.ReactElement }[] = [
  { id: 'expense', label: '支出管理', Icon: ChartTabIcon },
  { id: 'calendar', label: 'カレンダー', Icon: CalendarTabIcon },
  { id: 'assets', label: '資産管理', Icon: BottleTabIcon },
];

/** 端末の日付が変わったら追従する(要件 3.3)。 */
function useToday(): DateStr {
  const [today, setToday] = useState(() => todayStr());

  useEffect(() => {
    const sync = () => setToday((prev) => (todayStr() === prev ? prev : todayStr()));
    const id = window.setInterval(sync, 30_000);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return today;
}

export default function App() {
  const { data, addTransaction, updateTransaction, deleteTransaction, updateSettings, replaceAll } =
    useStore();
  const today = useToday();

  const [tab, setTab] = useState<Tab>('expense');
  const [categoryDetail, setCategoryDetail] = useState<CategoryId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [period, setPeriod] = useState<Period>(() => periodOf(todayStr(), 'month'));
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  // 資産管理タブを開くたびにアニメーションを再生する(要件 8.3)。
  const [assetsPlayKey, setAssetsPlayKey] = useState(0);

  /**
   * 起動時に登録モーダルを自動表示する(要件 9.1)。
   * ページが新規に読み込まれたときだけ true になるため、タブ切り替えや
   * バックグラウンドからの復帰では開かない。
   */
  const [sheet, setSheet] = useState<TransactionSheetMode | null>({ kind: 'create' });
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const selectTab = useCallback(
    (next: Tab) => {
      setSettingsOpen(false);
      // 同じタブをもう一度押したら、下位の画面から戻る。
      if (next === tab && next === 'expense') setCategoryDetail(null);
      if (next === 'assets') setAssetsPlayKey((k) => k + 1);
      setTab(next);
    },
    [tab],
  );

  const openSettings = useCallback(() => setSettingsOpen(true), []);

  const submitSheet = useCallback(
    (input: NewTransaction) => {
      if (sheet === null) return;
      if (sheet.kind === 'create') addTransaction(input);
      else updateTransaction(sheet.transaction.id, input);
      setSheet(null);
    },
    [sheet, addTransaction, updateTransaction],
  );

  const screen = useMemo(() => {
    if (settingsOpen) {
      return (
        <SettingsScreen
          data={data}
          today={today}
          onBack={() => setSettingsOpen(false)}
          onSaveSettings={updateSettings}
          onReplaceAll={replaceAll}
        />
      );
    }

    if (tab === 'expense') {
      if (categoryDetail !== null) {
        return (
          <CategoryDetailScreen
            categoryId={categoryDetail}
            period={period}
            transactions={data.transactions}
            onBack={() => setCategoryDetail(null)}
            onOpenDetail={setDetail}
            onRequestDelete={setDeleteTarget}
          />
        );
      }
      return (
        <ExpenseScreen
          transactions={data.transactions}
          period={period}
          onPeriodChange={setPeriod}
          onOpenCategory={setCategoryDetail}
          onOpenSettings={openSettings}
        />
      );
    }

    if (tab === 'calendar') {
      return (
        <CalendarScreen
          transactions={data.transactions}
          today={today}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          onOpenDetail={setDetail}
          onRequestDelete={setDeleteTarget}
          onOpenSettings={openSettings}
        />
      );
    }

    return (
      <AssetsScreen data={data} today={today} playKey={assetsPlayKey} onOpenSettings={openSettings} />
    );
  }, [
    settingsOpen,
    tab,
    categoryDetail,
    period,
    calendarMonth,
    assetsPlayKey,
    data,
    today,
    openSettings,
    updateSettings,
    replaceAll,
  ]);

  return (
    <div className="app">
      <div className="app__body">{screen}</div>

      <button type="button" className="fab" onClick={() => setSheet({ kind: 'create' })}>
        <PlusIcon />
        <span className="sr-only">記録を追加</span>
      </button>

      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className="tabbar__item"
            aria-current={!settingsOpen && tab === id ? 'page' : undefined}
            onClick={() => selectTab(id)}
          >
            <Icon />
            <span className="tabbar__label">{label}</span>
          </button>
        ))}
      </nav>

      {sheet !== null && (
        <TransactionSheet
          mode={sheet}
          today={today}
          onSubmit={submitSheet}
          onDismiss={() => setSheet(null)}
        />
      )}

      {sheet === null && detail !== null && (
        <DetailSheet
          transaction={detail}
          onEdit={() => {
            setSheet({ kind: 'edit', transaction: detail });
            setDetail(null);
          }}
          onDismiss={() => setDetail(null)}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          title="この記録を削除しますか？"
          text={
            deleteTarget.memo !== ''
              ? deleteTarget.memo
              : deleteTarget.category !== null
                ? CATEGORY_MAP[deleteTarget.category].label
                : '収入'
          }
          confirmLabel="削除"
          danger
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteTransaction(deleteTarget.id);
            setDeleteTarget(null);
            setDetail(null);
          }}
        />
      )}
    </div>
  );
}
