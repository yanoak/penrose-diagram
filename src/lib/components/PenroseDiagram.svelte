<script lang="ts">
	import type { Point, Region } from '$lib/math/types';
	import { config } from '$lib/stores/config.svelte';
	import {
		diamondVertices,
		singularityCurve,
		zigzagify,
		constantRCurve,
		constantTCurve,
		generateRValues,
		generateTValues,
		lightConePositions
	} from '$lib/math/curves';

	import DiagramBackground from './DiagramBackground.svelte';
	import Singularities from './Singularities.svelte';
	import Horizons from './Horizons.svelte';
	import ConstantRCurves from './ConstantRCurves.svelte';
	import ConstantTCurves from './ConstantTCurves.svelte';
	import LightCones from './LightCones.svelte';
	import RegionLabels from './RegionLabels.svelte';
	import InfinityLabels from './InfinityLabels.svelte';

	const clipId = 'diamond-clip';
	const singClipId = 'singularity-clip';
	const padding = 40;

	let size = $derived(config.diagramSize);
	let svgSize = $derived(size + padding * 2);
	let cx = $derived(svgSize / 2);
	let cy = $derived(svgSize / 2);
	let scale = $derived(size / 2);

	let vertices = $derived(diamondVertices(cx, cy, scale));

	// Singularity curves — smooth base curves + zigzag versions for rendering
	let futureSingBase = $derived(singularityCurve(true, cx, cy, scale));
	let pastSingBase = $derived(singularityCurve(false, cx, cy, scale));
	let futureSingularity = $derived(zigzagify(futureSingBase, 5, 18));
	let pastSingularity = $derived(zigzagify(pastSingBase, 5, 18));

	// Clip polygon: diamond shape but with top/bottom replaced by singularity curves.
	// Path: left vertex (i⁰) → future singularity (left→right) → right vertex (i⁰)
	//        → past singularity (right→left) → back to left vertex
	let singularityClipPoints = $derived.by(() => {
		const left = vertices[3];  // i⁰ left
		const right = vertices[1]; // i⁰ right
		const pts: Point[] = [
			left,
			...futureSingularity,      // top edge follows future zigzag
			right,
			...[...pastSingularity].reverse()  // bottom edge follows past zigzag
		];
		return pts.map(p => `${p.x},${p.y}`).join(' ');
	});

	// Which clip to use for content: either just diamond, or singularity-bounded region
	let contentClipId = $derived(config.clipToSingularities ? singClipId : clipId);

	// Constant-r curves
	let rCurves = $derived.by(() => {
		const rValues = generateRValues(config.numConstantR);
		return rValues.map(({ r, regions }) => {
			const curves = new Map<Region, Point[]>();
			for (const region of regions) {
				curves.set(region, constantRCurve(r, region, cx, cy, scale));
			}
			return { r, regions, curves };
		});
	});

	// Constant-t curves
	let tCurves = $derived.by(() => {
		const tValues = generateTValues(config.numConstantT);
		return tValues.map(({ t, regions }) => {
			const curves = new Map<Region, Point[]>();
			for (const region of regions) {
				curves.set(region, constantTCurve(t, region, cx, cy, scale));
			}
			return { t, regions, curves };
		});
	});

	// Light cones
	let cones = $derived(lightConePositions(cx, cy, scale));
	let coneSize = $derived(scale * 0.06);
</script>

<svg
	width={svgSize}
	height={svgSize}
	viewBox="0 0 {svgSize} {svgSize}"
	xmlns="http://www.w3.org/2000/svg"
>
	<DiagramBackground
		{vertices}
		{clipId}
		clippedPoints={config.clipToSingularities ? singularityClipPoints : undefined}
	/>

	<!-- Singularity clip path: intersection of diamond and region between singularity curves -->
	<defs>
		<clipPath id={singClipId}>
			<polygon points={singularityClipPoints} />
		</clipPath>
	</defs>

	{#if config.showConstantR}
		<ConstantRCurves
			curves={rCurves}
			color={config.constantRColor}
			strokeWidth={config.lineThickness}
			clipId={contentClipId}
		/>
	{/if}

	{#if config.showConstantT}
		<ConstantTCurves
			curves={tCurves}
			color={config.constantTColor}
			strokeWidth={config.lineThickness}
			clipId={contentClipId}
		/>
	{/if}

	{#if config.showHorizons}
		<g clip-path="url(#{contentClipId})">
			<Horizons
				{vertices}
				color={config.horizonColor}
				strokeWidth={config.lineThickness}
			/>
		</g>
	{/if}

	{#if config.showSingularities}
		<Singularities
			futureCurve={futureSingularity}
			pastCurve={pastSingularity}
			color={config.singularityColor}
			strokeWidth={config.lineThickness * 1.3}
			{clipId}
		/>
	{/if}

	{#if config.showLightCones}
		<LightCones
			{cones}
			size={coneSize}
			strokeWidth={config.lineThickness}
			clipId={contentClipId}
		/>
	{/if}

	{#if config.showRegionLabels}
		<RegionLabels {cx} {cy} {scale} />
	{/if}

	{#if config.showInfinityLabels}
		<InfinityLabels {vertices} />
	{/if}
</svg>
