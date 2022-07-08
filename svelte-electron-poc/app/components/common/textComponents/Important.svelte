<script lang="ts">
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";

	let div: HTMLElement;

	afterUpdate(() => {
		if (div) {
			flash(div, "Important");
		}
	});
</script>

<span
	bind:this={div}
	{...$$restProps}
	class="important {$$restProps.class || ''}"><slot /></span
>

<style lang="scss">
	.important {
		font-weight: 900;
		color: red;
	}
</style>
