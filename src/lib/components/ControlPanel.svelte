<script lang="ts">
	import { config } from '$lib/stores/config.svelte';

	function getSvgElement(): SVGSVGElement | null {
		return document.querySelector('.diagram-area svg');
	}

	function downloadSVG() {
		const svg = getSvgElement();
		if (!svg) return;
		const serializer = new XMLSerializer();
		const source = serializer.serializeToString(svg);
		const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'penrose-diagram.svg';
		a.click();
		URL.revokeObjectURL(url);
	}

	function downloadPNG() {
		const svg = getSvgElement();
		if (!svg) return;
		const scale = 2;
		const w = svg.viewBox.baseVal.width || svg.clientWidth;
		const h = svg.viewBox.baseVal.height || svg.clientHeight;
		const canvas = document.createElement('canvas');
		canvas.width = w * scale;
		canvas.height = h * scale;
		const ctx = canvas.getContext('2d')!;
		ctx.scale(scale, scale);

		const serializer = new XMLSerializer();
		const source = serializer.serializeToString(svg);
		const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const img = new Image();
		img.onload = () => {
			ctx.drawImage(img, 0, 0, w, h);
			URL.revokeObjectURL(url);
			const a = document.createElement('a');
			a.href = canvas.toDataURL('image/png');
			a.download = 'penrose-diagram.png';
			a.click();
		};
		img.src = url;
	}
</script>

<div class="control-panel">
	<h2>Diagram Controls</h2>

	<section>
		<h3>Curve Counts</h3>
		<label>
			<span>Constant-r curves: {config.numConstantR}</span>
			<input type="range" min="0" max="15" bind:value={config.numConstantR} />
		</label>
		<label>
			<span>Constant-t curves: {config.numConstantT}</span>
			<input type="range" min="0" max="15" bind:value={config.numConstantT} />
		</label>
	</section>

	<section>
		<h3>Visibility</h3>
		<label class="toggle">
			<input type="checkbox" bind:checked={config.showSingularities} />
			<span>Singularities</span>
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={config.showHorizons} />
			<span>Horizons</span>
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={config.showConstantR} />
			<span>Constant-r curves</span>
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={config.showConstantT} />
			<span>Constant-t curves</span>
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={config.showLightCones} />
			<span>Light cones</span>
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={config.clipToSingularities} />
			<span>Clip to singularities</span>
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={config.showInfinityLabels} />
			<span>Infinity labels</span>
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={config.showRegionLabels} />
			<span>Region labels</span>
		</label>
	</section>

	<section>
		<h3>Colors</h3>
		<label class="color-pick">
			<span>Singularities</span>
			<input type="color" bind:value={config.singularityColor} />
		</label>
		<label class="color-pick">
			<span>Horizons</span>
			<input type="color" bind:value={config.horizonColor} />
		</label>
		<label class="color-pick">
			<span>Constant-r</span>
			<input type="color" bind:value={config.constantRColor} />
		</label>
		<label class="color-pick">
			<span>Constant-t</span>
			<input type="color" bind:value={config.constantTColor} />
		</label>
	</section>

	<section>
		<h3>Singularity Zigzag</h3>
		<label>
			<span>Teeth count: {config.zigzagTeeth}</span>
			<input type="range" min="4" max="40" bind:value={config.zigzagTeeth} />
		</label>
		<label>
			<span>Amplitude: {config.zigzagAmplitude.toFixed(1)}</span>
			<input type="range" min="1" max="20" step="0.5" bind:value={config.zigzagAmplitude} />
		</label>
		<label>
			<span>Future vertical offset: {config.futureZigzagOffset}px</span>
			<input type="range" min="-50" max="50" bind:value={config.futureZigzagOffset} />
		</label>
		<label>
			<span>Past vertical offset: {config.pastZigzagOffset}px</span>
			<input type="range" min="-50" max="50" bind:value={config.pastZigzagOffset} />
		</label>
	</section>

	<section>
		<h3>Appearance</h3>
		<label>
			<span>Line thickness: {config.lineThickness.toFixed(1)}</span>
			<input type="range" min="0.5" max="4" step="0.1" bind:value={config.lineThickness} />
		</label>
		<label>
			<span>Diagram size: {config.diagramSize}px</span>
			<input type="range" min="400" max="800" step="10" bind:value={config.diagramSize} />
		</label>
	</section>

	<section>
		<h3>Export</h3>
		<div class="export-buttons">
			<button onclick={downloadSVG}>Download SVG</button>
			<button onclick={downloadPNG}>Download PNG</button>
		</div>
	</section>
</div>

<style>
	.control-panel {
		padding: 1.5rem;
		background: #f8f8f8;
		border-left: 1px solid #ddd;
		min-width: 280px;
		max-width: 320px;
		overflow-y: auto;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 14px;
	}

	h2 {
		margin: 0 0 1rem;
		font-size: 1.2rem;
		color: #333;
	}

	h3 {
		margin: 0 0 0.5rem;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #666;
	}

	section {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.6rem;
	}

	label span {
		display: block;
		margin-bottom: 0.2rem;
		color: #444;
	}

	input[type='range'] {
		width: 100%;
		cursor: pointer;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle span {
		display: inline;
		margin: 0;
	}

	.toggle input[type='checkbox'] {
		cursor: pointer;
		width: 16px;
		height: 16px;
	}

	.color-pick {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.color-pick span {
		display: inline;
		margin: 0;
	}

	.color-pick input[type='color'] {
		width: 40px;
		height: 28px;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		padding: 1px;
	}

	.export-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.export-buttons button {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: #fff;
		cursor: pointer;
		font-size: 0.85rem;
		color: #333;
	}

	.export-buttons button:hover {
		background: #eee;
	}
</style>
