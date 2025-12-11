import { InfiniteWall } from "@effect/infinite-wall/react";

export default function App() {
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
				style={{
					border: "4px dashed red",
					height: 400,
					width: 700,
					margin: 100,
					overflow: "visible",
				}}
			/>
		</div>
	);
}
