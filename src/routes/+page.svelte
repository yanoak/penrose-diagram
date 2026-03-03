<script lang="ts">
	import PenroseDiagram from '$lib/components/PenroseDiagram.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
</script>

<div class="app">
	<main class="diagram-area">
		<h1>Penrose-Carter Diagram</h1>
		<p class="subtitle">Maximally Extended Schwarzschild Black Hole</p>
		<PenroseDiagram />
	</main>
	<aside>
		<ControlPanel />
	</aside>
</div>

<style>
	.app {
		display: flex;
		min-height: 100vh;
	}

	main.diagram-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
	}

	h1 {
		margin: 0;
		font-family: 'Times New Roman', serif;
		font-size: 1.8rem;
		color: #222;
	}

	.subtitle {
		margin: 0.3rem 0 1.5rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 0.95rem;
		color: #666;
	}

	aside {
		flex-shrink: 0;
	}
</style>
