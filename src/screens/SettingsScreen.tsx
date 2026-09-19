import { useRef, useState } from 'react';
import { SAVINGS_MAX } from '../constants';
import { formatAmountInput, formatComma, parseAmountInput } from '../lib/format';
import { backupFileName, parseAppDataJson } from '../lib/storage';
import type { DateStr } from '../lib/date';
import type { AppData } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ChevronLeft } from '../components/icons';

const APP_VERSION = '1.0.0';

/** 設定画面(要件 11 章)。 */
export function SettingsScreen({
  data,
  today,
  onBack,
  onSaveSettings,
  onReplaceAll,
}: {
  data: AppData;
  today: DateStr;
  onBack: () => void;
  onSaveSettings: (settings: { savingsGoal: number; initialSavings: number }) => void;
  onReplaceAll: (data: AppData) => void;
}) {
  const [goalText, setGoalText] = useState(formatComma(data.settings.savingsGoal));
  const [initialText, setInitialText] = useState(formatComma(data.settings.initialSavings));
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const goal = parseAmountInput(goalText);
  const initial = parseAmountInput(initialText);
  const overLimit = goal > SAVINGS_MAX || initial > SAVINGS_MAX;
  const dirty = goal !== data.settings.savingsGoal || initial !== data.settings.initialSavings;

  const save = () => {
    if (overLimit) return;
    onSaveSettings({ savingsGoal: goal, initialSavings: initial });
    setMessage({ kind: 'ok', text: '保存しました' });
  };

  const exportData = async () => {
    setMessage(null);
    const json = JSON.stringify(data, null, 2);
    const fileName = backupFileName(today);
    const file = new File([json], fileName, { type: 'application/json' });

    // iPhone では共有シート経由で「ファイル」アプリ等に保存できる。
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName });
        return;
      } catch (e) {
        // ユーザーがキャンセルしただけなら何もしない。
        if (e instanceof DOMException && e.name === 'AbortError') return;
        // 共有できなければダウンロードにフォールバックする。
      }
    }

    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  const pickFile = async (file: File) => {
    setMessage(null);
    const parsed = parseAppDataJson(await file.text());
    if (parsed === null) {
      setMessage({
        kind: 'error',
        text: 'ファイルの形式が正しくありません。データは変更していません。',
      });
      return;
    }
    setPendingImport(parsed);
  };

  return (
    <>
      <header className="hdr hdr--sub">
        <button type="button" className="back-btn" onClick={onBack}>
          <ChevronLeft />
          戻る
        </button>
        <span className="hdr__title">設定</span>
        <span className="hdr__spacer" />
      </header>

      <div className="scroll scroll--padded">
        <h2 className="section-title">貯金</h2>
        <section className="card">
          <div className="settings__row">
            <label className="settings__row-label" htmlFor="set-goal">
              貯金の目標額
            </label>
            <input
              id="set-goal"
              className="settings__input num"
              inputMode="numeric"
              enterKeyHint="done"
              value={goalText}
              onChange={(e) => setGoalText(formatAmountInput(e.target.value))}
            />
            <span className="settings__unit">円</span>
          </div>
          <div className="settings__row">
            <label className="settings__row-label" htmlFor="set-initial">
              初期貯金額
            </label>
            <input
              id="set-initial"
              className="settings__input num"
              inputMode="numeric"
              enterKeyHint="done"
              value={initialText}
              onChange={(e) => setInitialText(formatAmountInput(e.target.value))}
            />
            <span className="settings__unit">円</span>
          </div>
          <div className="settings__row">
            <button type="button" className="btn" disabled={!dirty || overLimit} onClick={save}>
              保存
            </button>
          </div>
        </section>
        <p className="settings__desc">
          目標額を 0 にすると未設定になります。入力できるのは {formatComma(SAVINGS_MAX)} 円までです。
        </p>
        {overLimit && (
          <p className="settings__msg settings__msg--error">
            {formatComma(SAVINGS_MAX)} 円以下で入力してください
          </p>
        )}

        <h2 className="section-title">データ</h2>
        <section className="card">
          <button type="button" className="row" onClick={() => void exportData()}>
            <span className="row__main">
              <span className="row__title">データの書き出し</span>
              <span className="row__sub">{backupFileName(today)}</span>
            </span>
          </button>
          <button type="button" className="row" onClick={() => fileRef.current?.click()}>
            <span className="row__main">
              <span className="row__title">データの読み込み</span>
              <span className="row__sub">書き出した JSON ファイルから復元します</span>
            </span>
          </button>
        </section>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file !== undefined) void pickFile(file);
          }}
        />
        {message !== null && (
          <p className={`settings__msg settings__msg--${message.kind}`}>{message.text}</p>
        )}

        <p className="settings__version num">
          目指せQグレーダー v{APP_VERSION}（記録 {data.transactions.length} 件）
        </p>
      </div>

      {pendingImport !== null && (
        <ConfirmDialog
          title="現在のデータはすべて上書きされます。読み込みますか？"
          text={`記録 ${pendingImport.transactions.length} 件を読み込みます`}
          confirmLabel="読み込む"
          danger
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            onReplaceAll(pendingImport);
            setGoalText(formatComma(pendingImport.settings.savingsGoal));
            setInitialText(formatComma(pendingImport.settings.initialSavings));
            setPendingImport(null);
            setMessage({ kind: 'ok', text: 'データを読み込みました' });
          }}
        />
      )}
    </>
  );
}
