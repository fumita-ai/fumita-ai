import type { SVGProps } from 'react';
import type { CategoryId } from '../types';

type IconProps = SVGProps<SVGSVGElement>;

/** 線画アイコンの共通設定。 */
function Line({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

// --- カテゴリ(要件 3.4) -----------------------------------------------------

const HousingIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M3.6 10.8 12 4l8.4 6.8" />
    <path d="M5.6 9.6V19a1 1 0 0 0 1 1h3.2v-5.2h4.4V20h3.2a1 1 0 0 0 1-1V9.6" />
  </Line>
);

const FoodIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M7.4 3.4v4.4a2.1 2.1 0 0 0 4.2 0V3.4" />
    <path d="M9.5 3.4v6.4" />
    <path d="M9.5 9.8V20.6" />
    <path d="M16.9 3.4c1.5 2 1.5 5.6 0 7.6v9.6" />
  </Line>
);

const ClothingIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M8.8 3.6 5 5.6l1.7 3.6 2.1-1V20h6.4V8.2l2.1 1L19 5.6l-3.8-2a3.2 3.2 0 0 1-6.4 0Z" />
  </Line>
);

const HobbyIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="m12 3.8 2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.82l-5.1 2.68.98-5.68L3.75 9.8l5.7-.83Z" />
  </Line>
);

const DailyIcon = (p: IconProps) => (
  <Line {...p}>
    {/* ブラシの毛 */}
    <path d="M9.2 4.6V2.4M12 4.6V2.4M14.8 4.6V2.4" />
    {/* ブラシの頭 */}
    <rect x="7.5" y="4.6" width="9" height="4.6" rx="1.7" />
    {/* 柄 */}
    <path d="M12 9.2v2.6a1.9 1.9 0 0 1-1.9 1.9 1.9 1.9 0 0 0-1.9 1.9v4.3a2 2 0 0 0 2 2h3.6a2 2 0 0 0 2-2v-2.6" />
  </Line>
);

const OtherIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...p}>
    <circle cx="5.8" cy="12" r="1.75" />
    <circle cx="12" cy="12" r="1.75" />
    <circle cx="18.2" cy="12" r="1.75" />
  </svg>
);

/** 収入用(財布)。要件 7.1 の「収入用のアイコン」。 */
export const IncomeIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 8.4v9.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6.4a2 2 0 0 0-2-2H6a2 2 0 0 1-2-2Z" />
    <path d="M4 8.4a2 2 0 0 1 2-2h10.4" />
    <circle cx="16.6" cy="14.2" r="1.2" fill="currentColor" stroke="none" />
  </Line>
);

const CATEGORY_ICONS: Record<CategoryId, (p: IconProps) => React.ReactElement> = {
  housing: HousingIcon,
  food: FoodIcon,
  clothing: ClothingIcon,
  hobby: HobbyIcon,
  daily: DailyIcon,
  other: OtherIcon,
};

export function CategoryGlyph({ id, ...props }: { id: CategoryId } & IconProps) {
  const Glyph = CATEGORY_ICONS[id];
  return <Glyph {...props} />;
}

// --- 画面まわり -------------------------------------------------------------

export const ChevronLeft = (p: IconProps) => (
  <Line {...p} strokeWidth={2.2}>
    <path d="m14.5 5-7 7 7 7" />
  </Line>
);

export const ChevronRight = (p: IconProps) => (
  <Line {...p} strokeWidth={2.2}>
    <path d="m9.5 5 7 7-7 7" />
  </Line>
);

export const GearIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.4 14.4a1.6 1.6 0 0 0 .32 1.77l.06.06a1.94 1.94 0 1 1-2.75 2.75l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47v.17a1.94 1.94 0 0 1-3.88 0v-.09a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a1.94 1.94 0 1 1-2.75-2.75l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97h-.17a1.94 1.94 0 0 1 0-3.88h.09a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a1.94 1.94 0 1 1 2.75-2.75l.06.06a1.6 1.6 0 0 0 1.77.32h.08a1.6 1.6 0 0 0 .97-1.47v-.17a1.94 1.94 0 1 1 3.88 0v.09a1.6 1.6 0 0 0 .97 1.46 1.6 1.6 0 0 0 1.77-.32l.06-.06a1.94 1.94 0 1 1 2.75 2.75l-.06.06a1.6 1.6 0 0 0-.32 1.77v.08a1.6 1.6 0 0 0 1.47.97h.17a1.94 1.94 0 0 1 0 3.88h-.09a1.6 1.6 0 0 0-1.46.97Z" />
  </Line>
);

export const PlusIcon = (p: IconProps) => (
  <Line {...p} strokeWidth={2.4}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Line>
);

/** 月 / 年 の表示単位切り替え。 */
export const MonthYearIcon = ({ unit, ...p }: { unit: 'month' | 'year' } & IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...p}>
    <rect
      x="3.2"
      y="4.6"
      width="17.6"
      height="15.2"
      rx="3.4"
      stroke="currentColor"
      strokeWidth={1.8}
    />
    <path d="M7.6 2.8v3.4M16.4 2.8v3.4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    <text
      x="12"
      y="16.4"
      textAnchor="middle"
      fontSize="8.6"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
    >
      {unit === 'month' ? '月' : '年'}
    </text>
  </svg>
);

export const ChartTabIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 3.8V12l7.1 4.1" />
  </Line>
);

export const CalendarTabIcon = (p: IconProps) => (
  <Line {...p}>
    <rect x="3.4" y="5" width="17.2" height="15" rx="3.2" />
    <path d="M3.4 9.6h17.2M8 2.9v3.6M16 2.9v3.6" />
  </Line>
);

/** 資産管理タブ(牛乳瓶)。 */
export const BottleTabIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M9.6 2.9h4.8v3.2l1.9 3.3V19.7a1.4 1.4 0 0 1-1.4 1.4H9.1a1.4 1.4 0 0 1-1.4-1.4V9.4l1.9-3.3Z" />
    <path d="M7.9 13.4h8.4" />
  </Line>
);

export const TrashIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4.8 6.6h14.4M9.4 6.6V4.8a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.8" />
    <path d="M6.8 6.6 7.6 19a1.4 1.4 0 0 0 1.4 1.3h6a1.4 1.4 0 0 0 1.4-1.3l.8-12.4" />
  </Line>
);

export const CloseIcon = (p: IconProps) => (
  <Line {...p} strokeWidth={2.2}>
    <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
  </Line>
);
