import { CATEGORY_MAP } from '../constants';
import type { CategoryId } from '../types';
import { CategoryGlyph, IncomeIcon } from './icons';

/** 色付き丸のカテゴリアイコン(要件 6.1 / 7.1)。収入は中立色の財布アイコン。 */
export function CategoryBadge({
  id,
  size = 30,
}: {
  id: CategoryId | null;
  size?: number;
}) {
  const style = {
    width: size,
    height: size,
    background: id === null ? 'var(--accent-muted)' : CATEGORY_MAP[id].color,
  };
  return (
    <span className="cat-badge" style={style}>
      {id === null ? <IncomeIcon /> : <CategoryGlyph id={id} />}
    </span>
  );
}
