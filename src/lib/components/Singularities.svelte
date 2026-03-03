<script lang="ts">
	import type { Point } from '$lib/math/types';

	interface Props {
		futureCurve: Point[];
		pastCurve: Point[];
		color: string;
		strokeWidth: number;
		clipId: string;
	}

	let { futureCurve, pastCurve, color, strokeWidth, clipId }: Props = $props();

	function toPolyline(pts: Point[]): string {
		return pts.map(p => `${p.x},${p.y}`).join(' ');
	}
</script>

<g clip-path="url(#{clipId})">
	{#if futureCurve.length > 1}
		<polyline
			points={toPolyline(futureCurve)}
			fill="none"
			stroke={color}
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{/if}
	{#if pastCurve.length > 1}
		<polyline
			points={toPolyline(pastCurve)}
			fill="none"
			stroke={color}
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{/if}
</g>
