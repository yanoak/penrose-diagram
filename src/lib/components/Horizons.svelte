<script lang="ts">
	import type { Point } from '$lib/math/types';

	interface Props {
		vertices: Point[];
		color: string;
		strokeWidth: number;
	}

	let { vertices, color, strokeWidth }: Props = $props();

	// vertices: [0]=top(i⁺), [1]=right(i⁰), [2]=bottom(i⁻), [3]=left(i⁰)
	// Horizons (r=1) map to T_P = ±R_P, which intersect the diamond boundary
	// at the midpoints of the edges.
	let midTR = $derived({ x: (vertices[0].x + vertices[1].x) / 2, y: (vertices[0].y + vertices[1].y) / 2 });
	let midBL = $derived({ x: (vertices[2].x + vertices[3].x) / 2, y: (vertices[2].y + vertices[3].y) / 2 });
	let midTL = $derived({ x: (vertices[0].x + vertices[3].x) / 2, y: (vertices[0].y + vertices[3].y) / 2 });
	let midBR = $derived({ x: (vertices[2].x + vertices[1].x) / 2, y: (vertices[2].y + vertices[1].y) / 2 });
</script>

<g>
	<!-- Horizon: T_P = R_P (from bottom-left to top-right) -->
	<line
		x1={midBL.x} y1={midBL.y}
		x2={midTR.x} y2={midTR.y}
		stroke={color}
		stroke-width={strokeWidth}
		stroke-dasharray="6,4"
	/>
	<!-- Horizon: T_P = -R_P (from bottom-right to top-left) -->
	<line
		x1={midBR.x} y1={midBR.y}
		x2={midTL.x} y2={midTL.y}
		stroke={color}
		stroke-width={strokeWidth}
		stroke-dasharray="6,4"
	/>
</g>
