/**
 * 计算保持16:9比例的游戏尺寸
 * @param windowWidth 窗口宽度
 * @param windowHeight 窗口高度
 * @param baseWidth 基准宽度（默认1600）
 * @param baseHeight 基准高度（默认900）
 * @returns {{width: number, height: number}} 计算后的尺寸
 */
export function calculateGameSize(
    windowWidth: number,
    windowHeight: number,
    baseWidth: number = 1600,
    baseHeight: number = 900
): { width: number; height: number } {
    let width = windowWidth;
    let height = windowHeight;

    // 如果当前窗口大于基准尺寸，则按比例放大
    if (width > baseWidth || height > baseHeight) {
        width = 2400
        height = 1350
    } else {
        // 如果小于基准尺寸，使用基准尺寸
        width = baseWidth;
        height = baseHeight;
    }

    return { width, height };
}
