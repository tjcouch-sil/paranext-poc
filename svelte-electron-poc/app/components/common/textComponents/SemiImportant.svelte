<script lang="ts">
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";

	let div: HTMLElement;

	afterUpdate(() => {
		if (div) {
			flash(div, "SemiImportant");
		}
	});
</script>

<!-- Every component that wants to be part of the text editing needs at least {...$$restProps} to accept the rest of the props given to its parent Content -->
<!-- Every text editing component that wants to display children must have <slot /> in order to accept the children given to its parent Content -->
<span bind:this={div} {...$$restProps} class="semi-important"><slot /></span>

<style lang="scss">
	.semi-important {
		font-weight: 700;
		color: rebeccapurple;
	}
</style>
