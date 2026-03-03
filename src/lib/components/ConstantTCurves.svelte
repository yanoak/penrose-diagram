<script lang="ts">
	import type { Point, Region } from '$lib/math/types';
	import { pointsToSmoothPath } from '$lib/math/curves';

	interface CurveData {
		t: number;
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
</script>

<g clip-path="url(#{clipId})">
	{#each curves as curve}
		{#each curve.regions as region}
			{@const pts = curve.curves.get(region)}
			{#if pts && pts.length > 1}
				<path
					d={pointsToSmoothPath(pts)}
					fill="none"
					stroke={color}
					stroke-width={strokeWidth}
					opacity="0.7"
				/>
			{/if}
		{/each}
	{/each}
</g>
