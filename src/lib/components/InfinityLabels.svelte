<script lang="ts">
	import type { Point } from '$lib/math/types';

	interface Props {
		vertices: Point[];
	}

	let { vertices }: Props = $props();

	const pad = 18;

	// vertices: [0]=top(i⁺), [1]=right(i⁰), [2]=bottom(i⁻), [3]=left(i⁰)
	let scrPlus1 = $derived({
		x: (vertices[0].x + vertices[1].x) / 2,
		y: (vertices[0].y + vertices[1].y) / 2
	});
	let scrPlus2 = $derived({
		x: (vertices[0].x + vertices[3].x) / 2,
		y: (vertices[0].y + vertices[3].y) / 2
	});
	let scrMinus1 = $derived({
		x: (vertices[2].x + vertices[1].x) / 2,
		y: (vertices[2].y + vertices[1].y) / 2
	});
	let scrMinus2 = $derived({
		x: (vertices[2].x + vertices[3].x) / 2,
		y: (vertices[2].y + vertices[3].y) / 2
	});
</script>

<g class="infinity-labels" font-family="'Times New Roman', serif" font-size="16" fill="#333">
	<!-- i⁺ (future timelike infinity) — top vertex -->
	<text x={vertices[0].x} y={vertices[0].y - pad} text-anchor="middle" font-style="italic">i⁺</text>

	<!-- i⁻ (past timelike infinity) — bottom vertex -->
	<text x={vertices[2].x} y={vertices[2].y + pad + 14} text-anchor="middle" font-style="italic">i⁻</text>

	<!-- i⁰ (spacelike infinity) — right vertex -->
	<text x={vertices[1].x + pad} y={vertices[1].y + 5} text-anchor="start" font-style="italic">i⁰</text>

	<!-- i⁰ (spacelike infinity) — left vertex -->
	<text x={vertices[3].x - pad} y={vertices[3].y + 5} text-anchor="end" font-style="italic">i⁰</text>

	<!-- 𝒥⁺ (future null infinity) — top-right edge -->
	<text x={scrPlus1.x + pad * 0.8} y={scrPlus1.y} text-anchor="start" font-style="italic">𝒥⁺</text>

	<!-- 𝒥⁺ (future null infinity) — top-left edge -->
	<text x={scrPlus2.x - pad * 0.8} y={scrPlus2.y} text-anchor="end" font-style="italic">𝒥⁺</text>

	<!-- 𝒥⁻ (past null infinity) — bottom-right edge -->
	<text x={scrMinus1.x + pad * 0.8} y={scrMinus1.y} text-anchor="start" font-style="italic">𝒥⁻</text>

	<!-- 𝒥⁻ (past null infinity) — bottom-left edge -->
	<text x={scrMinus2.x - pad * 0.8} y={scrMinus2.y} text-anchor="end" font-style="italic">𝒥⁻</text>
</g>
