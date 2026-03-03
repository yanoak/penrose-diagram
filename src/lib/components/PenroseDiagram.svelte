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
	// The exact asymptotic endpoints are the edge midpoints of the diamond
	let edgeMidLeft = $derived({ x: (vertices[3].x + vertices[0].x) / 2, y: (vertices[3].y + vertices[0].y) / 2 });
	let edgeMidRight = $derived({ x: (vertices[0].x + vertices[1].x) / 2, y: (vertices[0].y + vertices[1].y) / 2 });
	let edgeMidLeftBot = $derived({ x: (vertices[3].x + vertices[2].x) / 2, y: (vertices[3].y + vertices[2].y) / 2 });
	let edgeMidRightBot = $derived({ x: (vertices[2].x + vertices[1].x) / 2, y: (vertices[2].y + vertices[1].y) / 2 });
	let futureSingBase = $derived([edgeMidLeft, ...singularityCurve(true, cx, cy, scale), edgeMidRight]);
	let pastSingBase = $derived([edgeMidLeftBot, ...singularityCurve(false, cx, cy, scale), edgeMidRightBot]);
	let futureSingularity = $derived(
		zigzagify(futureSingBase, config.zigzagAmplitude, config.zigzagTeeth)
			.map(p => ({ x: p.x, y: p.y + config.futureZigzagOffset }))
	);
	let pastSingularity = $derived(
		zigzagify(pastSingBase, config.zigzagAmplitude, config.zigzagTeeth)
			.map(p => ({ x: p.x, y: p.y + config.pastZigzagOffset }))
	);

	// Clip polygon: diamond with top/bottom replaced by zigzag singularity curves.
	// Uses exact edge midpoints as anchors so the sides follow the diamond edges.
	let singularityClipPoints = $derived.by(() => {
		const left = vertices[3];   // i⁰ left
		const right = vertices[1];  // i⁰ right
		const pts: Point[] = [
			left,
			edgeMidLeft,
			...futureSingularity.slice(1, -1),
			edgeMidRight,
			right,
			edgeMidRightBot,
			...[...pastSingularity].reverse().slice(1, -1),
			edgeMidLeftBot,
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
