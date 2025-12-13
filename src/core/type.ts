export interface BrickElement extends HTMLDivElement {
	/** 砖的 ID, 这个是固定的， */
	readonly brickId: number;
	/** 砖的 X 轴 ID */
	brickX: number;
	/** 砖的 Y 轴 ID */
	brickY: number;
}
export type ApplyZoomResult = {
	brickWidth: number;
	brickHeight: number;
	offsetLeft: number;
	offsetTop: number;
};
