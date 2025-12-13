import { calcLayout, calcBrickPosition } from "./_calc.ts";
import type { InputData, CalcData, InputDataBase } from "./_calc.ts";
import type { ApplyZoomResult, BrickElement } from "./type.ts";

export type InfiniteWallRenderOption = {
	/** 砖块高度 */
	brickHeight?: number;
	/** 砖块宽度 */
	brickWidth?: number;
	// /** 大于或等于1，默认1， 预渲染X轴方向的砖块数量，超出可视区域的砖块数量 */
	// preRenderX?: number;
	// /** 大于或等于1，默认1， 预渲染Y轴方向的砖块数量，超出可视区域的砖块数量 */
	// preRenderY?: number;
	/** 创建砖块时触发，参数为新的真实砖块 */
	initBrick?: (elements: BrickElement[]) => void;
	/** 删除砖块时触发，参数为被删除的真实砖块 */
	onRemoveBrick?: (elements: BrickElement[]) => void;
	/** 更新砖块时触发，参数为被更新的真实砖块 */
	onBrickUpdate?: (elements: BrickElement[]) => void;
};
export type ZoomOption = {
	/** 锚点 X 坐标。默认为可视区域中心*/
	anchorX?: number;
	/** 锚点 Y 坐标。默认为可视区域中心*/
	anchorY?: number;
	/** 缩放倍数 */
	zoom?: number;
	/** 指定缩放后的砖块宽度。如果设置 zoom，则忽略 */
	brickWidth?: number;
	/** 指定缩放后的砖块高度。如果设置 zoom，则忽略 */
	brickHeight?: number;
};

export class InfiniteWallRender {
	constructor(option: InfiniteWallRenderOption = {}) {
		const inputBase: InputDataBase = {
			containerHeight: 0,
			containerWidth: 0,
			scrollTop: 0,
			scrollLeft: 0,
			brickHeight: option.brickHeight || 0,
			brickWidth: option.brickWidth || 0,
		};
		this.#inputData = {
			...inputBase,
			preRenderX: 1,
			preRenderY: 1,
		};
		this.#calcData = {
			...inputBase,
			xCount: 0,
			yCount: 0,
			screenX: 0,
			screenY: 0,
			realOffsetLeft: 0,
			realOffsetTop: 0,
			realHeightTotal: 0,
			realWidthTotal: 0,
			changedWith: false,
		};
		this.#onBrickUpdate = option.onBrickUpdate;
		this.initBrick = option.initBrick;
		this.#onRemoveBrick = option.onRemoveBrick;

		this.requestRender();
	}
	setElement(element: HTMLElement) {
		this.#element = element;
		this.#cancelRequest();
		this.requestRender();
	}
	get container() {
		return this.#element;
	}
	#element?: HTMLElement;
	initBrick?: (elements: BrickElement[]) => void;
	#onRemoveBrick?: (elements: BrickElement[]) => void;
	#onBrickUpdate?: (elements: BrickElement[]) => void;

	#inputData: InputData;
	#calcData: CalcData;

	/** 虚拟垂直滚动 */
	get scrollTop() {
		return this.#inputData.scrollTop;
	}
	set scrollTop(value: number) {
		if (value === this.#inputData.scrollTop) return;
		this.#inputData.scrollTop = value;
		this.requestRender();
	}

	/** 虚拟水平滚动 */
	get scrollLeft() {
		return this.#inputData.scrollLeft;
	}
	set scrollLeft(value: number) {
		if (value === this.#inputData.scrollLeft) return;
		this.#inputData.scrollLeft = value;
		this.requestRender();
	}
	/** 每个方块高度 */
	get brickHeight() {
		return this.#inputData.brickHeight;
	}
	set brickHeight(value: number) {
		if (value === this.#inputData.brickHeight) return;
		if (!(value > 0)) throw new Error("brickHeight must be greater than 0");

		this.#inputData.brickHeight = value;
		this.requestRender();
	}
	/** 每个方块宽度 */
	get brickWidth() {
		return this.#inputData.brickWidth;
	}
	set brickWidth(value: number) {
		if (value === this.#inputData.brickWidth) return;
		if (!(value > 0)) throw new Error("brickWidth must be greater than 0");
		this.#inputData.brickWidth = value;
		this.requestRender();
	}

	/** 容器内 x轴向真实的元素数量 */
	get realXBrickCount() {
		return this.#calcData.xCount;
	}
	/** 容器内 x轴向真实的元素数量 */
	get realYBrickCount() {
		return this.#calcData.yCount;
	}

	/** 这会同时更改 offsetLeft、offsetHeight、brickHeight、brickWidth */
	applyZoom(config: ZoomOption): ApplyZoomResult {
		const inputData = this.#inputData;
		let zoom = config.zoom;
		const { anchorX = inputData.containerWidth / 2, anchorY = inputData.containerHeight / 2 } = config;

		if (zoom !== undefined) {
			if (zoom <= 0) throw new Error("zoom must be greater than 0");
			if (!Number.isFinite(zoom)) throw new Error("zoom must be a finite number");

			inputData.scrollLeft = zoom * (inputData.scrollLeft - anchorX) + anchorX;
			inputData.scrollTop = zoom * (inputData.scrollTop - anchorY) + anchorY;
			inputData.brickHeight *= zoom;
			inputData.brickWidth *= zoom;
			this.requestRender();
		} else if (config.brickWidth || config.brickHeight) {
			const brickWidth = config.brickWidth ?? inputData.brickWidth;
			const brickHeight = config.brickHeight ?? inputData.brickHeight;

			if (!(brickWidth > 0)) throw new Error("brickWidth must be greater than 0");
			if (!(brickHeight > 0)) throw new Error("brickHeight must be greater than 0");

			const zoomX = brickWidth / inputData.brickWidth;
			const zoomY = brickHeight / inputData.brickHeight;

			inputData.scrollLeft = zoomX * (inputData.scrollLeft - anchorX) + anchorX;
			inputData.scrollTop = zoomY * (inputData.scrollTop - anchorY) + anchorY;
			inputData.brickWidth = brickWidth;
			inputData.brickHeight = brickHeight;
			this.requestRender();
		}
		return {
			brickWidth: inputData.brickWidth,
			brickHeight: inputData.brickHeight,
			offsetLeft: inputData.scrollLeft,
			offsetTop: inputData.scrollTop,
		};
	}

	#requesting: number | null = null;
	requestRender() {
		if (this.#requesting !== null) return;
		// requesting 期间如果修改 element，需要 cancel 掉之前的请求
		const element = this.#element;
		if (!element) return;
		this.#requesting = requestAnimationFrame(() => {
			this.#requesting = null;
			this.#calcLayout(element);
			this.#render(element, this.#calcData);
		});
	}
	#cancelRequest() {
		if (this.#requesting === null) return;
		cancelAnimationFrame(this.#requesting);
		this.#requesting = null;
	}
	#calcLayout(element: HTMLElement) {
		const inputData = this.#inputData;
		const calcData = this.#calcData;
		inputData.containerHeight = element.clientHeight;
		inputData.containerWidth = element.clientWidth;
		calcLayout(inputData, calcData);
	}
	#render(element: HTMLElement, calcData: CalcData) {
		const { brickHeight, brickWidth, xCount, yCount } = calcData;

		const totalCount = xCount * yCount;

		const childNodes = element.childNodes;

		/** 处理需要移除的元素 */
		if (childNodes.length > totalCount) {
			let removeCount = childNodes.length - totalCount;
			const arr = new Array(removeCount);
			for (let i = childNodes.length - 1; i >= totalCount; i--) {
				element.removeChild(childNodes[i]);
				arr[i - totalCount] = childNodes[i];
			}
			this.#onRemoveBrick?.(arr);
		}

		const oldTotal = childNodes.length;

		const limitWidth = calcData.realWidthTotal - brickWidth;
		const limitHeight = calcData.realHeightTotal - brickHeight;

		let item: BrickElement;
		let x: number;
		let y: number;

		/** 处理需要新增的元素 */
		const newsList: BrickElement[] = new Array(totalCount - oldTotal);
		for (let i = oldTotal; i < totalCount; i++) {
			x = i % xCount;
			y = Math.floor(i / xCount);
			const position = calcBrickPosition(calcData, limitWidth, limitHeight, x, y);
			item = createItem(brickHeight, brickWidth, i, position.brickX, position.brickY);

			item.style.transform = `translate(${position.offsetLeft}px, ${position.offsetTop}px)`;
			element.appendChild(item);

			newsList[totalCount - i - 1] = item;
		}

		let changedList: BrickElement[] = [];
		const needUpdateWidth = calcData.changedWith;

		/** 处理需要更新的元素 */
		for (let i = 0; i < oldTotal; i++) {
			item = childNodes[i] as BrickElement;

			x = i % xCount;
			y = Math.floor(i / xCount);

			const position = calcBrickPosition(calcData, limitWidth, limitHeight, x, y);
			const positionChanged = item.brickX !== position.brickX || item.brickY !== position.brickY;
			if (positionChanged) {
				item.brickX = position.brickX;
				item.brickY = position.brickY;
			}
			if (needUpdateWidth) {
				item.style.width = brickWidth + "px";
				item.style.height = brickHeight + "px";
			}
			if (positionChanged || needUpdateWidth) changedList.push(item);
			item.style.transform = `translate(${position.offsetLeft}px, ${position.offsetTop}px)`;
		}
		if (newsList.length > 0) {
			changedList = changedList.concat(newsList);
			this.initBrick?.(newsList);
		}
		if (changedList.length > 0) {
			this.#onBrickUpdate?.(changedList);
		}
	}
	/** 获取所有真实元素 */
	get elements(): NodeListOf<BrickElement> {
		if (this.#element) return this.#element.childNodes as NodeListOf<BrickElement>;
		return getEmptyNodeList();
	}
	/** 判断指定位置的砖块是否在可视区域外 */
	isHidden(x: number, y: number) {
		const { brickHeight, brickWidth, containerHeight, containerWidth, scrollLeft, scrollTop } = this.#calcData;

		const realScrollLeft = scrollLeft % containerWidth;
		const realScrollTop = scrollTop % containerHeight;

		const offsetLeft = x * brickWidth + realScrollLeft;
		const offsetTop = y * brickHeight + realScrollTop;
		return offsetLeft < 0 || offsetLeft > containerWidth || offsetTop < 0 || offsetTop > containerHeight;
	}
}
let emptyNodeList: NodeListOf<any> | null = null;
function getEmptyNodeList(): NodeListOf<any> {
	if (!emptyNodeList) emptyNodeList = document.createElement("div").childNodes;
	return emptyNodeList;
}
function createItem(height: number, width: number, id: number, x: number, y: number): BrickElement {
	const node = document.createElement("div") as Omit<BrickElement, "brickId"> & { brickId: number };
	node.style.position = "absolute";
	node.style.width = width + "px";
	node.style.height = height + "px";
	node.brickId = id;
	node.brickX = x;
	node.brickY = y;
	return node;
}
