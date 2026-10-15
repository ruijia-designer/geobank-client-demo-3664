import { describe, expect, it } from 'vitest';
import {
  MIN_RESULT_LAYOUT_WIDTH,
  resizeResultColumns,
  resolveResultColumns,
} from './resultLayout';
import type { ResultColumnPreference, ResultLayoutMode } from './resultLayout';

const defaults: ResultColumnPreference = { directoryWidth: null, informationRatio: null };

describe('成果页三栏尺寸', () => {
  it.each([
    [1920, 254, 0.49],
    [1280, 226, 0.48],
    [1450, 226, 0.48],
    [1451, 254, 0.49],
  ])('按 %i 窗口恢复设计默认宽度', (width, directory, ratio) => {
    const sizes = resolveResultColumns(width, defaults);
    expect(sizes.directory).toBe(directory);
    expect(sizes.information).toBeCloseTo((width - directory) * ratio);
    expect(sizes.directory + sizes.information + sizes.right).toBeCloseTo(width);
  });

  it('拖第一条分界线只调整目录和项目信息，保持右栏宽度', () => {
    const start = resolveResultColumns(1920, defaults);
    const preference = resizeResultColumns(1920, start, defaults, 'directory', 70, 'split');
    const sizes = resolveResultColumns(1920, preference);
    expect(sizes.directory).toBe(start.directory + 70);
    expect(sizes.information).toBeCloseTo(start.information - 70);
    expect(sizes.right).toBeCloseTo(start.right);
  });

  it.each([-5000, 5000])('目录拖至边界 %i 时保留相邻栏最小宽度', delta => {
    const start = resolveResultColumns(1280, defaults);
    const sizes = resolveResultColumns(1280,
      resizeResultColumns(1280, start, defaults, 'directory', delta, 'split'));
    expect(sizes.directory).toBeGreaterThanOrEqual(200);
    expect(sizes.directory).toBeLessThanOrEqual(360);
    expect(sizes.information).toBeGreaterThanOrEqual(420);
    expect(sizes.right).toBeCloseTo(start.right);
    if (delta < 0) expect(sizes.directory).toBe(200);
    else expect(sizes.information).toBeCloseTo(420);
  });

  it('大窗口目录最多360px', () => {
    const start = resolveResultColumns(1920, defaults);
    const sizes = resolveResultColumns(1920,
      resizeResultColumns(1920, start, defaults, 'directory', 5000, 'split'));
    expect(sizes.directory).toBe(360);
    expect(sizes.right).toBeCloseTo(start.right);
  });

  it.each([-5000, 5000])('第二条分界线移动 %i 时固定目录并限制两栏至少420px', delta => {
    const start = resolveResultColumns(1280, defaults);
    const preference = resizeResultColumns(1280, start, defaults, 'information', delta, 'split');
    const sizes = resolveResultColumns(1280, preference);
    expect(sizes.directory).toBe(start.directory);
    expect(sizes.information).toBeGreaterThanOrEqual(420);
    expect(sizes.right).toBeGreaterThanOrEqual(420);
    expect(sizes.information + sizes.right).toBe(1280 - start.directory);
    expect(delta < 0 ? sizes.information : sizes.right).toBeCloseTo(420);
    expect(preference.directoryWidth).toBeNull();
  });

  it.each<ResultLayoutMode>(['right', 'information'])('%s最大化拖目录保留隐藏栏比例', mode => {
    const preference: ResultColumnPreference = { directoryWidth: 240, informationRatio: 0.56 };
    const start = resolveResultColumns(1920, preference);
    const next = resizeResultColumns(1920, start, preference, 'directory', 50, mode);
    expect(next).toEqual({ directoryWidth: 290, informationRatio: 0.56 });
    expect(resizeResultColumns(1920, start, defaults, 'directory', 50, mode).informationRatio).toBeNull();
    expect(resizeResultColumns(1920, start, preference, 'information', 50, mode)).toBe(preference);
  });

  it('窗口缩小时只限制最终尺寸，不覆盖偏好，放大后恢复比例', () => {
    const preference = { directoryWidth: 360, informationRatio: 0.7 };
    const narrow = resolveResultColumns(1040, preference);
    expect(narrow).toEqual({ directory: 200, information: 420, right: 420 });
    expect(preference).toEqual({ directoryWidth: 360, informationRatio: 0.7 });
    const wide = resolveResultColumns(1920, preference);
    expect(wide.directory).toBe(360);
    expect(wide.information).toBeCloseTo(1560 * 0.7);
  });

  it.each([0, 500, -100, Number.NaN, Number.POSITIVE_INFINITY])('宽度%i安全回退到最小画布', width => {
    const sizes = resolveResultColumns(width, defaults);
    expect(sizes).toEqual({ directory: 200, information: 420, right: 420 });
    expect(Object.values(sizes).reduce((sum, value) => sum + value)).toBe(MIN_RESULT_LAYOUT_WIDTH);
  });

  it.each([0, 1, -0.5, Number.NaN, Number.POSITIVE_INFINITY])('无效信息比例%s按默认布局', informationRatio => {
    expect(resolveResultColumns(1920, { directoryWidth: Number.NaN, informationRatio }))
      .toEqual(resolveResultColumns(1920, defaults));
  });

  it('非法目录值回默认，有限越界值限制到范围', () => {
    expect(resolveResultColumns(1920, { ...defaults, directoryWidth: Number.POSITIVE_INFINITY }).directory).toBe(254);
    expect(resolveResultColumns(1920, { ...defaults, directoryWidth: -1 }).directory).toBe(200);
    expect(resolveResultColumns(1920, { ...defaults, directoryWidth: 999 }).directory).toBe(360);
  });

  it('无效拖动量不修改偏好，无效起始尺寸安全回退', () => {
    const start = resolveResultColumns(1920, defaults);
    expect(resizeResultColumns(1920, start, defaults, 'directory', Number.NaN, 'split')).toBe(defaults);
    const next = resizeResultColumns(1920, { directory: -1, information: Number.NaN, right: 2 },
      defaults, 'directory', 20, 'split');
    expect(next).toEqual(resizeResultColumns(1920, start, defaults, 'directory', 20, 'split'));
  });

  it('每次由拖动起点计算，不累加先前指针变化，零位移不固化默认值', () => {
    const start = resolveResultColumns(1920, defaults);
    expect(resizeResultColumns(1920, start, defaults, 'directory', 0, 'split')).toBe(defaults);
    const one = resizeResultColumns(1920, start, defaults, 'directory', 20, 'split');
    const two = resizeResultColumns(1920, start, defaults, 'directory', 40, 'split');
    expect(one.directoryWidth).toBe(274);
    expect(two.directoryWidth).toBe(294);
    expect(defaults).toEqual({ directoryWidth: null, informationRatio: null });
  });
});
