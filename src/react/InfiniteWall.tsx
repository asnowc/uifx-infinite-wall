import { useEffect, useMemo, useRef, useImperativeHandle } from "react";
import type { RefObject, HTMLAttributes, ReactNode } from "react";
import { useInfiniteWall, type UseInfiniteWallOption } from "./useInfiniteWall.ts";
import { ListenMoveArea } from "./ListenMoveArea.ts";
import type { ApplyZoomResult, InfiniteWallRender } from "@uifx/infinite-wall";

export type InfiniteWallProps = HTMLAttributes<HTMLDivElement> &
	Pick<UseInfiniteWallOption, "brickHeight" | "brickWidth" | "renderItem"> & {
		onMoveStart?: () => void;
		onMoveEnd?: () => void;
		onZoom?: (result: ApplyZoomResult) => void;
		/**如果为 true, 则可以使用鼠标拖拽移动  默认 false. */
		draggable?: boolean;
		/** 如果为 true, 则可以使用 ctrl + 鼠标滚轮缩放  默认 false. */
		zoomControl?: boolean;
		/** force render 的依赖，当这个数组内发生变化时，强制更新 React Portal */
		deps?: any[];
		ref?: RefObject<InfiniteWallRender | null>;
	};

export function InfiniteWall(props: InfiniteWallProps): ReactNode {
	const {
		style,
		deps = [],
		brickHeight,
		brickWidth,
		draggable,
		zoomControl,
		ref,
		renderItem,
		onMoveStart,
		onMoveEnd,
		onMouseDown,
		onZoom,
		...rest
	} = props;

	const { list, wall, updateList, setElement } = useInfiniteWall({
		brickHeight,
		brickWidth,
		renderItem,
	});
	const propsRef = useRef(props);
	propsRef.current = props;
	useImperativeHandle(ref, () => wall, [wall]);
	useEffect(() => {
		const container = wall.container;
		if (!zoomControl || !container) return;
		function onWheel(this: HTMLElement, e: WheelEvent) {
			if (!e.ctrlKey) return;
			e.preventDefault();

			const delta = -e.deltaY;
			const zoomFactor = 1.1;
			const zoom = delta > 0 ? zoomFactor : 1 / zoomFactor;
			const p = this.getBoundingClientRect();
			const result = wall.applyZoom({
				zoom,
				anchorX: e.clientX - p.left,
				anchorY: e.clientY - p.top,
			});
			propsRef.current.onZoom?.(result);
		}
		container.addEventListener("wheel", onWheel, { passive: false });
		return () => {
			container.removeEventListener("wheel", onWheel);
		};
	}, [zoomControl]); //当前情况下，container 不会变更，无需重新监听鼠标滚轮事件

	/** 鼠标拖拽 */
	const area = useMemo((): ListenMoveArea & ScrollMeta => {
		const area = new ListenMoveArea(
			function (dx, dy) {
				wall.scrollTop = area.baseY + dy;
				wall.scrollLeft = area.baseX + dx;
			},
			() => {
				propsRef.current.onMoveEnd?.();
			}
		) as ListenMoveArea & ScrollMeta;
		area.baseX = 0;
		area.baseY = 0;
		return area;
	}, []);

	useEffect(() => {
		updateList();
	}, deps);
	return (
		<div
			{...rest}
			ref={setElement}
			style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", ...style }}
			onMouseDown={
				draggable
					? (e) => {
							onMouseDown?.(e);
							if (e.defaultPrevented) return;
							onMoveStart?.();
							area.startMove(e.clientX, e.clientY);
							area.baseX = wall.scrollLeft;
							area.baseY = wall.scrollTop;
					  }
					: onMouseDown
			}
		>
			{list}
		</div>
	);
}

type ScrollMeta = {
	baseX: number;
	baseY: number;
};
