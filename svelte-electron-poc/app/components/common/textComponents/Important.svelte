<script lang="ts">
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";

	export let id: string;

	let div: HTMLElement;

	afterUpdate(() => {
		if (div) {
			flash(div);
		}
	});
</script>

<span bind:this={div} {id} {...$$restProps} class="important"><slot /></span>

<style lang="scss">
	.important {
		font-weight: 900;
		color: red;
	}
</style>
