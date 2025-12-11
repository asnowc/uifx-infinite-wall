export interface BrickElement extends HTMLDivElement {
	/** 砖的 ID, 对于没块砖，这个是固定的， */
	readonly brickId: number;
	/** 砖的 X 轴 ID。对于虚拟的砖，它是固定的，对于真实的砖，它会变化 */
	brickX: number;
	/** 砖的 Y 轴 ID。对于虚拟的砖，它是固定的，对于真实的砖，它会变化 */
	brickY: number;
}
