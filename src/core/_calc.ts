export type InputDataBase = {
	containerWidth: number;
	containerHeight: number;

	/** 虚拟垂直滚动距离 */
	scrollTop: number;
	/** 虚拟水平滚动距离 */
	scrollLeft: number;

	/** 单个元素高度 */
	brickHeight: number;
	/** 单个元素宽度 */
	brickWidth: number;
};
export type InputData = InputDataBase & {
	/** 大于或等于1，预渲染X轴方向的砖块数量，超出可视区域的砖块数量 */
	readonly preRenderX: number;
	/** 大于或等于1，预渲染Y轴方向的砖块数量，超出可视区域的砖块数量 */
	readonly preRenderY: number;
};
export type CalcData = InputDataBase & {
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

	/** 是否需要更新元素宽高 */
	changedWith: boolean;

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
export function calcLayout(input: Readonly<InputData>, output: CalcData) {
	const { brickHeight, brickWidth, scrollLeft, scrollTop, containerHeight, containerWidth } = input;
	if (!(brickHeight > 0)) {
		throw new Error("brickHeight must be greater than 0");
	}
	if (!(brickWidth > 0)) {
		throw new Error("brickWidth must be greater than 0");
	}

	output.changedWith = input.brickWidth !== output.brickWidth || input.brickHeight !== output.brickHeight;
	output.brickHeight = brickHeight;
	output.brickWidth = brickWidth;
	output.containerHeight = containerHeight;
	output.containerWidth = containerWidth;
	output.scrollLeft = scrollLeft;
	output.scrollTop = scrollTop;

	const xCount = input.preRenderX + Math.ceil(containerWidth / brickWidth);
	const yCount = input.preRenderY + Math.ceil(containerHeight / brickHeight);
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
}

export function calcBrickPosition(calcData: CalcData, overWidth: number, overHeight: number, idX: number, idY: number) {
	const { brickHeight, brickWidth } = calcData;
	let offsetLeft = idX * brickWidth + calcData.realOffsetLeft;
	let offsetTop = idY * brickHeight + calcData.realOffsetTop;

	let screenX: number;
	if (offsetLeft > overWidth) {
		// 右边元素移到最左边
		offsetLeft = offsetLeft - overWidth - brickWidth;
		screenX = calcData.screenX - 1;
	} else if (offsetLeft < -brickWidth) {
		// 左边元素移到最右边
		offsetLeft = offsetLeft + overWidth + brickWidth;
		screenX = calcData.screenX + 1;
	} else {
		screenX = calcData.screenX;
	}
	const brickX: number = screenX * calcData.xCount + idX;

	let screenY: number;
	if (offsetTop > overHeight) {
		offsetTop = offsetTop - overHeight - brickHeight;
		screenY = calcData.screenY - 1;
	} else if (offsetTop < -brickHeight) {
		offsetTop = offsetTop + overHeight + brickHeight;
		screenY = calcData.screenY + 1;
	} else {
		screenY = calcData.screenY;
	}
	const brickY = screenY * calcData.yCount + idY;

	return {
		brickX,
		brickY,
		offsetLeft,
		offsetTop,
	};
}
