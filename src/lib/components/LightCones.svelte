<script lang="ts">
	import type { Point } from '$lib/math/types';

	interface LightCone {
		center: Point;
		region: string;
	}

	interface Props {
		cones: LightCone[];
		size: number;
		strokeWidth: number;
		clipId: string;
	}

	let { cones, size, strokeWidth, clipId }: Props = $props();
</script>

<g clip-path="url(#{clipId})">
	{#each cones as cone}
		<!-- Future light cone (upward V) -->
		<line
			x1={cone.center.x - size} y1={cone.center.y + size}
			x2={cone.center.x} y2={cone.center.y - size}
			stroke="#666"
			stroke-width={strokeWidth * 0.6}
			opacity="0.5"
		/>
		<line
			x1={cone.center.x + size} y1={cone.center.y + size}
			x2={cone.center.x} y2={cone.center.y - size}
			stroke="#666"
			stroke-width={strokeWidth * 0.6}
			opacity="0.5"
		/>
		<!-- Fill the future light cone -->
		<polygon
			points="{cone.center.x - size},{cone.center.y + size} {cone.center.x},{cone.center.y - size} {cone.center.x + size},{cone.center.y + size}"
			fill="#666"
			opacity="0.08"
		/>
	{/each}
</g>
