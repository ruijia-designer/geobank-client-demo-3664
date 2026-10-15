export type ResultLayoutMode = 'split' | 'right' | 'information';

export interface ResultColumnPreference {
  directoryWidth: number | null;
  informationRatio: number | null;
}

export interface ResultColumnSizes {
  directory: number;
  information: number;
  right: number;
}

export const MIN_RESULT_LAYOUT_WIDTH = 1040;

const MIN_DIRECTORY_WIDTH = 200;
const MAX_DIRECTORY_WIDTH = 360;
const MIN_CONTENT_WIDTH = 420;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const layoutWidth = (width: number) => Number.isFinite(width)
  ? Math.max(MIN_RESULT_LAYOUT_WIDTH, width)
  : MIN_RESULT_LAYOUT_WIDTH;
const validRatio = (ratio: number | null): ratio is number =>
  ratio !== null && Number.isFinite(ratio) && ratio > 0 && ratio < 1;

/** Resolve preferences without changing them when a smaller viewport clamps a column. */
export function resolveResultColumns(width: number, preference: ResultColumnPreference): ResultColumnSizes {
  const available = layoutWidth(width);
  const wide = available > 1450;
  const defaultDirectory = wide ? 254 : 226;
  const directory = clamp(
    preference.directoryWidth !== null && Number.isFinite(preference.directoryWidth)
      ? preference.directoryWidth
      : defaultDirectory,
    MIN_DIRECTORY_WIDTH,
    Math.min(MAX_DIRECTORY_WIDTH, available - MIN_CONTENT_WIDTH * 2),
  );
  const content = available - directory;
  const ratio = validRatio(preference.informationRatio)
    ? preference.informationRatio
    : wide ? 0.49 : 0.48;
  const information = clamp(content * ratio, MIN_CONTENT_WIDTH, content - MIN_CONTENT_WIDTH);
  return { directory, information, right: content - information };
}

/** Resize adjacent columns using the pointer-down sizes, avoiding cumulative drag drift. */
export function resizeResultColumns(
  width: number,
  start: ResultColumnSizes,
  preference: ResultColumnPreference,
  divider: 'directory' | 'information',
  delta: number,
  mode: ResultLayoutMode,
): ResultColumnPreference {
  if (!Number.isFinite(delta) || (mode !== 'split' && divider === 'information')) return preference;
  const available = layoutWidth(width);
  const fallback = resolveResultColumns(available, preference);
  const validStart = Number.isFinite(start.directory) && Number.isFinite(start.information)
    && Number.isFinite(start.right) && start.directory >= MIN_DIRECTORY_WIDTH
    && start.directory <= MAX_DIRECTORY_WIDTH && start.information >= MIN_CONTENT_WIDTH
    && start.right >= MIN_CONTENT_WIDTH
    && Math.abs(start.directory + start.information + start.right - available) < 0.01;
  const columns = validStart ? start : fallback;

  if (divider === 'directory') {
    const maxDirectory = mode === 'split'
      ? Math.min(MAX_DIRECTORY_WIDTH, columns.directory + columns.information - MIN_CONTENT_WIDTH)
      : Math.min(MAX_DIRECTORY_WIDTH, available - MIN_CONTENT_WIDTH * 2);
    const directory = clamp(columns.directory + delta, MIN_DIRECTORY_WIDTH, maxDirectory);
    if (directory === columns.directory) return preference;
    return {
      directoryWidth: directory,
      informationRatio: mode === 'split'
        ? (columns.information + columns.directory - directory) / (available - directory)
        : preference.informationRatio,
    };
  }

  const information = clamp(
    columns.information + delta,
    MIN_CONTENT_WIDTH,
    available - columns.directory - MIN_CONTENT_WIDTH,
  );
  if (information === columns.information) return preference;
  return {
    directoryWidth: preference.directoryWidth,
    informationRatio: information / (available - columns.directory),
  };
}
