export type InputData = {
	/** 虚拟垂直滚动距离 */
	scrollTop: number;
	/** 虚拟水平滚动距离 */
	scrollLeft: number;
	/** 单个元素高度 */
	brickHeight: number;
	/** 单个元素宽度 */
	brickWidth: number;
};
export type CalcData = {
	/** 容器内 x轴向真实的元素数量 */
	xCount: number;
	/** 容器内 y轴向真实的元素数量 */
	yCount: number;

	/** 容器内砖块宽度总和 */
	realWidthTotal: number;
	/** 容器内砖块高度总和 */
	realHeightTotal: number;
	/** 真实的水平偏移 */
	realOffsetLeft: number;
	/** 真实的垂直偏移 */
	realOffsetTop: number;

	screenX: number;
	screenY: number;
};
export type RenderLayout = InputData & CalcData;

/**
 * 计算渲染布局
 * @param input 输入数据
 * @param output 将计算结果写入的对象
 * @param containerWidth 容器宽度
 * @param containerHeight 容器高度
 */
export function calcLayout(
	input: Readonly<InputData>,
	output: CalcData,
	containerWidth: number,
	containerHeight: number
) {
	const { brickHeight, brickWidth, scrollLeft, scrollTop } = input;

	const xCount = 1 + Math.ceil(containerWidth / brickWidth);
	const yCount = 1 + Math.ceil(containerHeight / brickHeight);
	const limitWidth = xCount * brickWidth;
	const limitHeight = yCount * brickHeight;

	output.xCount = xCount;
	output.yCount = yCount;

	output.realWidthTotal = limitWidth;
	output.realHeightTotal = limitHeight;

	output.realOffsetLeft = scrollLeft % limitWidth;
	output.realOffsetTop = scrollTop % limitHeight;
	output.screenX = scrollLeft < 0 ? Math.floor(-scrollLeft / limitWidth) : Math.ceil(-scrollLeft / limitWidth);
	output.screenY = scrollTop < 0 ? Math.floor(-scrollTop / limitHeight) : Math.ceil(-scrollTop / limitHeight);
	return input;
}

export function calcBrickPosition(
	layout: RenderLayout,
	overWidth: number,
	overHeight: number,
	idX: number,
	idY: number
) {
	const { brickHeight: blockHeight, brickWidth: blockWidth } = layout;
	let offsetLeft = idX * blockWidth + layout.realOffsetLeft;
	let offsetTop = idY * blockHeight + layout.realOffsetTop;

	let screenX: number;
	if (offsetLeft > overWidth) {
		// 右边元素移到最左边
		offsetLeft = offsetLeft - overWidth - blockWidth;
		screenX = layout.screenX - 1;
	} else if (offsetLeft < -blockWidth) {
		// 左边元素移到最右边
		offsetLeft = offsetLeft + overWidth + blockWidth;
		screenX = layout.screenX + 1;
	} else {
		screenX = layout.screenX;
	}
	const brickX: number = screenX * layout.xCount + idX;

	let screenY: number;
	if (offsetTop > overHeight) {
		offsetTop = offsetTop - overHeight - blockHeight;
		screenY = layout.screenY - 1;
	} else if (offsetTop < -blockHeight) {
		offsetTop = offsetTop + overHeight + blockHeight;
		screenY = layout.screenY + 1;
	} else {
		screenY = layout.screenY;
	}
	const brickY = screenY * layout.yCount + idY;

	return {
		brickX,
		brickY,
		offsetLeft,
		offsetTop,
	};
}
