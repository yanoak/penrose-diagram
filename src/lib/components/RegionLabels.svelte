<script lang="ts">
	interface Props {
		cx: number;
		cy: number;
		scale: number;
	}

	let { cx, cy, scale }: Props = $props();

	const offset = $derived(scale * 0.28);
</script>

<g class="region-labels" font-family="'Times New Roman', serif" font-size="20" font-weight="bold" fill="#444">
	<!-- Region I (right) -->
	<text x={cx + offset} y={cy + 6} text-anchor="middle">I</text>
	<!-- Region II (top/future) -->
	<text x={cx} y={cy - offset + 6} text-anchor="middle">II</text>
	<!-- Region III (left) -->
	<text x={cx - offset} y={cy + 6} text-anchor="middle">III</text>
	<!-- Region IV (bottom/past) -->
	<text x={cx} y={cy + offset + 6} text-anchor="middle">IV</text>
</g>
