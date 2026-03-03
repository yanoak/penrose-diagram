<script lang="ts">
	import type { Point } from '$lib/math/types';

	interface Props {
		vertices: Point[];
		clipId: string;
		clippedPoints?: string;
	}

	let { vertices, clipId, clippedPoints }: Props = $props();

	let polygonPoints = $derived(vertices.map(v => `${v.x},${v.y}`).join(' '));
	let bgPoints = $derived(clippedPoints ?? polygonPoints);
</script>

<defs>
	<clipPath id={clipId}>
		<polygon points={polygonPoints} />
	</clipPath>
</defs>

<!-- Background fill uses clipped shape if provided -->
<polygon
	points={bgPoints}
	fill="#faf8f0"
	stroke="#333"
	stroke-width="1.5"
/>
