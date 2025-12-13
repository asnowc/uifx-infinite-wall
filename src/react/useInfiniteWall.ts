import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { InfiniteWallRender } from "../mod.ts";
import type { BrickElement, InfiniteWallRenderOption } from "../mod.ts";
import { createPortal } from "react-dom";
import { devRender } from "./_devRender.tsx";

export type UseInfiniteWallOption = Pick<InfiniteWallRenderOption, "brickHeight" | "brickWidth"> & {
	renderItem?: (node: BrickElement, wall: InfiniteWallRender) => ReactNode;
};
export type UseInfiniteWallReturn = {
	list: readonly ReactNode[];
	wall: InfiniteWallRender;
	updateList: () => void;
	setElement: (el: HTMLElement | null) => void;
};
export function useInfiniteWall(config: UseInfiniteWallOption): UseInfiniteWallReturn {
	const { brickWidth: blockWidth = 50, brickHeight: blockHeight = blockWidth } = config;
	const renderRef = useRef<UseInfiniteWallOption>(config);
	renderRef.current = config;

	const wall = useMemo(() => {
		return new InfiniteWallRender({
			onBrickUpdate(elements) {
				updateList();
			},
		});
	}, []);

	const [list, updateList] = useReducer((): ReactNode[] => {
		const { renderItem = devRender } = renderRef.current;

		const elements = wall.elements;
		const news = new Array(elements.length);
		for (let i = 0; i < elements.length; i++) {
			const element = elements[i];
			const reactNode = createPortal(renderItem(element, wall), element, i);
			news[i] = reactNode;
		}
		return news;
	}, []);
	const setElement = useCallback((el: HTMLElement | null) => {
		if (el) {
			wall.setElement(el);
		}
	}, []);

	useMemo(() => {
		wall.brickHeight = blockHeight;
		wall.brickWidth = blockWidth;
	}, [blockHeight, blockWidth]);

	useEffect(() => {
		const onResize = () => {
			wall.requestRender();
		};
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("resize", onResize);
		};
	}, []);

	return { list, wall, updateList, setElement };
}
