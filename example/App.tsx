import { InfiniteWall } from "@effect/infinite-wall/react";
import { useState } from "react";

export default function App() {
	const [wallProps, setWallProps] = useState({
		draggable: true,
		zoomControl: true,
		brickHeight: 50,
		brickWidth: 50,
	});
	const [overflowHidden, setOverflowHidden] = useState(true);
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100vh",
				width: "100vw",
			}}
		>
			<InfiniteWall
				brickHeight={wallProps.brickHeight}
				brickWidth={wallProps.brickWidth}
				draggable={wallProps.draggable}
				zoomControl={wallProps.zoomControl}
				style={{
					border: "4px dashed red",
					height: 400,
					width: 700,
					margin: 100,
					overflow: overflowHidden ? "hidden" : "visible",
				}}
			/>
			<div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 16 }}>
				<label style={{ userSelect: "none" }}>
					<input type="checkbox" checked={overflowHidden} onChange={(e) => setOverflowHidden(e.target.checked)} />
					overflowHidden
				</label>
				{[
					{ label: "draggable", value: wallProps.draggable },
					{ label: "zoomControl", value: wallProps.zoomControl },
				].map(({ label, value }) => (
					<label key={label} style={{ userSelect: "none" }}>
						<input
							type="checkbox"
							checked={value}
							onChange={(e) => setWallProps((prev) => ({ ...prev, [label]: e.target.checked }))}
						/>
						{label}
					</label>
				))}
				{[
					{ label: "brickHeight", value: wallProps.brickHeight, min: 10, max: 500 },
					{ label: "brickWidth", value: wallProps.brickWidth, min: 10, max: 500 },
				].map(({ label, value, max, min }) => (
					<label key={label}>
						<input
							type="range"
							min={min}
							max={max}
							value={value}
							step="10"
							onChange={(e) => setWallProps((prev) => ({ ...prev, [label]: +e.target.value }))}
						/>
						{label}
					</label>
				))}
				<div style={{ whiteSpace: "pre" }}>{JSON.stringify(wallProps, null, 2)}</div>
			</div>
		</div>
	);
}
