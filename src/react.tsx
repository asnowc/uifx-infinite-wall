import { InfiniteWallRender, type BrickElement, ListenMoveArea, type InfiniteWallOptions } from "./mod.ts";
import React, { type ReactNode, useEffect, useMemo, useReducer, useRef, type HTMLAttributes } from "react";
import { createPortal } from "react-dom";

export type InfiniteWallProps = HTMLAttributes<HTMLDivElement> &
	Pick<InfiniteWallConfig, "brickHeight" | "brickWidth" | "renderItem"> & {
		renderItem?: (brick: BrickElement, wall: InfiniteWallRender) => ReactNode;
		deps?: any[];
	};
export function InfiniteWall(props: InfiniteWallProps) {
	const { className, style, deps = [], brickHeight, brickWidth, renderItem, ...rest } = props;

	const ref = useRef<HTMLDivElement>(null);
	/** 无限滚动 */
	const { list, wallRef, updateList } = useInfiniteWall({
		containerRef: ref,
		brickHeight,
		brickWidth,
		renderItem,
	});
	/** 鼠标拖拽 */
	const area = useMemo((): ListenMoveArea & ScrollMeta => {
		const area = new ListenMoveArea(function (dx, dy) {
			const dom = wallRef.current!;
			dom.scrollTop = area.baseY + dy;
			dom.scrollLeft = area.baseX + dx;
		}) as ListenMoveArea & ScrollMeta;
		area.baseX = 0;
		area.baseY = 0;
		return area;
	}, []);

	useEffect(() => {
		updateList();
	}, deps);
	return (
		<div
			className={className}
			style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", ...style }}
			ref={ref}
			onMouseDown={(e) => {
				area.onTargetStart(e.clientX, e.clientY);
				const wall = wallRef.current!;
				area.baseX = wall.scrollLeft;
				area.baseY = wall.scrollTop;
			}}
			onMouseUp={(e) => {
				area.onTargetEnd();
			}}
			{...rest}
		>
			{list}
		</div>
	);
}
export type InfiniteWallConfig = Pick<InfiniteWallOptions, "brickHeight" | "brickWidth"> & {
	renderItem?: (node: BrickElement, wall: InfiniteWallRender) => ReactNode;
	ref?: React.RefObject<InfiniteWallRender | null | undefined>;
};
type ScrollMeta = {
	baseX: number;
	baseY: number;
};
export function useInfiniteWall(
	config: InfiniteWallConfig & {
		containerRef: React.RefObject<HTMLDivElement | null | undefined>;
	}
) {
	const { containerRef, brickWidth: blockWidth = 50, brickHeight: blockHeight = blockWidth } = config;
	const wallRef = useRef<InfiniteWallRender>(null);
	const renderRef = useRef<InfiniteWallConfig>(config);
	renderRef.current = config;

	const [list, updateList] = useReducer((): ReactNode[] => {
		const { renderItem = devRender } = renderRef.current;

		const wall = wallRef.current!;
		const elements = wall.elements;
		const news = new Array(elements.length);
		for (let i = 0; i < elements.length; i++) {
			const element = elements[i];
			const reactNode = createPortal(renderItem(element, wall), element, i);
			news[i] = reactNode;
		}
		return news;
	}, []);
	useEffect(() => {
		const dom = containerRef.current;
		if (!dom) return;

		const wall = new InfiniteWallRender(dom, {
			brickHeight: blockHeight,
			brickWidth: blockWidth,
			onBrickUpdate(elements) {
				updateList();
			},
		});
		if (config.ref) config.ref.current = wall;
		wallRef.current = wall;
	}, [containerRef]);
	useEffect(() => {
		const onResize = () => {
			wallRef.current?.requestRender();
		};
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("resize", onResize);
		};
	}, []);
	useMemo(() => {
		if (!wallRef.current) return;
		const wall = wallRef.current;
		wall.brickHeight = blockHeight;
		wall.brickWidth = blockWidth;
	}, [blockHeight, blockWidth]);

	return { list, wallRef, updateList };
}
function devRender(element: BrickElement, wall: InfiniteWallRender) {
	return (
		<div
			style={{
				border: "1px solid #000",
				height: "100%",
				width: "100%",
				padding: 2,
				fontSize: 10,
				boxSizing: "border-box",
			}}
		>
			<div style={{ color: "#a4a230", textAlign: "center" }}>{element.brickId}</div>
			<div style={{ fontWeight: "bold" }}>
				{element.brickX}
				<br />
				<div style={{ textAlign: "right" }}>{element.brickY}</div>
			</div>
		</div>
	);
}
