import type { BrickElement, InfiniteWallRender } from "../mod.ts";

export function devRender(element: BrickElement, wall: InfiniteWallRender) {
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
