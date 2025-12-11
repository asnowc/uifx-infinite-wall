import { calcLayout, calcBrickPosition, type RenderLayout } from "./_calc.ts";
import type { BrickElement } from "./type.ts";

export type InfiniteWallOptions = {
	brickHeight?: number;
	brickWidth?: number;
	/** 创建砖块时触发，参数为新的真实砖块 */
	createBrick?: (elements: BrickElement[]) => void;
	/** 删除砖块时触发，参数为被删除的真实砖块 */
	removeBrick?: (elements: BrickElement[]) => void;
	/** 更新砖块时触发，参数为被更新的真实砖块 */
	onBrickUpdate?: (elements: BrickElement[]) => void;
};

export class InfiniteWallRender {
	constructor(public element: HTMLElement, option: InfiniteWallOptions = {}) {
		this.#layoutData = {
			scrollTop: 0,
			scrollLeft: 0,
			brickHeight: option.brickHeight || 0,
			brickWidth: option.brickWidth || 0,

			xCount: 0,
			yCount: 0,
			screenX: 0,
			screenY: 0,
			realOffsetLeft: 0,
			realOffsetTop: 0,
			realHeightTotal: 0,
			realWidthTotal: 0,
		};
		this.#onBrickUpdate = option.onBrickUpdate;
		this.#createBrick = option.createBrick;
		this.#removeBrick = option.removeBrick;

		this.requestRender();
	}

	#createBrick?: (elements: BrickElement[]) => void;
	#removeBrick?: (elements: BrickElement[]) => void;
	#onBrickUpdate?: (elements: BrickElement[]) => void;

	#layoutData: RenderLayout;
	/** 虚拟垂直滚动 */
	get scrollTop() {
		return this.#layoutData.scrollTop;
	}
	set scrollTop(value: number) {
		if (value === this.#layoutData.scrollTop) return;
		this.#layoutData.scrollTop = value;
		this.requestRender();
	}

	/** 虚拟水平滚动 */
	get scrollLeft() {
		return this.#layoutData.scrollLeft;
	}
	set scrollLeft(value: number) {
		if (value === this.#layoutData.scrollLeft) return;
		this.#layoutData.scrollLeft = value;
		this.requestRender();
	}
	/** 每个方块高度 */
	get brickHeight() {
		return this.#layoutData.brickHeight;
	}
	set brickHeight(value: number) {
		if (value === this.#layoutData.brickHeight) return;
		this.#layoutData.brickHeight = value;
		this.requestRender();
	}
	/** 每个方块宽度 */
	get brickWidth() {
		return this.#layoutData.brickWidth;
	}
	set brickWidth(value: number) {
		this.#layoutData.brickWidth = value;
		this.requestRender();
	}

	/** 容器内 x轴向真实的元素数量 */
	get realXBrickCount() {
		return this.#layoutData.xCount;
	}
	/** 容器内 x轴向真实的元素数量 */
	get realYBrickCount() {
		return this.#layoutData.yCount;
	}
	#requesting = false;
	requestRender() {
		if (this.#requesting) return;
		this.#requesting = true;
		requestAnimationFrame(() => {
			this.#render();
			this.#requesting = false;
		});
	}

	#render() {
		const layout = this.#layoutData;
		calcLayout(layout, layout, this.element.clientWidth, this.element.clientHeight);

		const { brickHeight, brickWidth, xCount, yCount } = layout;

		const limitWidth = (xCount - 1) * brickWidth;
		const limitHeight = (yCount - 1) * brickHeight;

		const totalCount = xCount * yCount;

		const childNodes = this.element.childNodes;
		if (childNodes.length > totalCount) {
			let removeCount = childNodes.length - totalCount;
			const arr = new Array(removeCount);
			for (let i = childNodes.length - 1; i >= totalCount; i--) {
				this.element.removeChild(childNodes[i]);
				arr[i - totalCount] = childNodes[i];
			}
			this.#removeBrick?.(arr);
		}

		const oldTotal = childNodes.length;

		let item: BrickElement;
		let x: number;
		let y: number;

		const newsList: BrickElement[] = new Array(totalCount - oldTotal);
		for (let i = oldTotal; i < totalCount; i++) {
			x = i % xCount;
			y = Math.floor(i / xCount);
			item = createItem(brickHeight, brickWidth, i, x, y);

			const position = calcBrickPosition(layout, limitWidth, limitHeight, x, y);

			const changed = item.brickX !== position.brickX || item.brickY !== position.brickY;
			if (changed) {
				item.brickX = position.brickX;
				item.brickY = position.brickY;
			}

			item.style.transform = `translate(${position.offsetLeft}px, ${position.offsetTop}px)`;
			this.element.appendChild(item);

			newsList[totalCount - i - 1] = item;
		}

		let changedList: BrickElement[] = [];

		for (let i = 0; i < oldTotal; i++) {
			item = childNodes[i] as BrickElement;

			x = i % xCount;
			y = Math.floor(i / xCount);

			const position = calcBrickPosition(layout, limitWidth, limitHeight, x, y);
			const changed = item.brickX !== position.brickX || item.brickY !== position.brickY;
			if (changed) {
				item.brickX = position.brickX;
				item.brickY = position.brickY;
			}
			if (changed) changedList.push(item);
			item.style.transform = `translate(${position.offsetLeft}px, ${position.offsetTop}px)`;
		}
		if (newsList.length > 0) {
			changedList = changedList.concat(newsList);
			this.#createBrick?.(newsList);
		}
		if (changedList.length > 0) {
			this.#onBrickUpdate?.(changedList);
		}
	}
	/** 获取所有真实元素 */
	get elements(): NodeListOf<BrickElement> {
		return this.element.childNodes as NodeListOf<BrickElement>;
	}
	isHidden(x: number, y: number) {
		const { brickHeight: blockHeight, brickWidth: blockWidth } = this.#layoutData;
		const { clientHeight: containerHeight, clientWidth: containerWidth } = this.element;

		const scrollLeft = this.#layoutData.scrollLeft % containerWidth;
		const scrollTop = this.#layoutData.scrollTop % containerHeight;

		const offsetLeft = x * blockWidth + scrollLeft;
		const offsetTop = y * blockHeight + scrollTop;

		return offsetLeft < 0 || offsetLeft > containerWidth || offsetTop < 0 || offsetTop > containerHeight;
	}
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
