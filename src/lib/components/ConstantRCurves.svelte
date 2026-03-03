<script lang="ts">
	import type { Point, Region } from '$lib/math/types';

	interface CurveData {
		r: number;
		regions: Region[];
		curves: Map<Region, Point[]>;
	}

	interface Props {
		curves: CurveData[];
		color: string;
		strokeWidth: number;
		clipId: string;
	}

	let { curves, color, strokeWidth, clipId }: Props = $props();

	function toPolyline(pts: Point[]): string {
		return pts.map(p => `${p.x},${p.y}`).join(' ');
	}
</script>

<g clip-path="url(#{clipId})">
	{#each curves as curve}
		{#each curve.regions as region}
			{@const pts = curve.curves.get(region)}
			{#if pts && pts.length > 1}
				<polyline
					points={toPolyline(pts)}
					fill="none"
					stroke={color}
					stroke-width={strokeWidth}
					opacity="0.7"
				/>
			{/if}
		{/each}
	{/each}
</g>
