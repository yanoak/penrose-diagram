<script>
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #fff;
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
