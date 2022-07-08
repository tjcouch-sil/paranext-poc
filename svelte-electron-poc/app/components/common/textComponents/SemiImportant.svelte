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
<!-- Additionally, any attributes on a component need to be able to accept props coming in (for example, class here also accepts $$restProps.class)-->
<!-- Every text editing component that wants to display children must have <slot /> in order to accept the children given to its parent Content -->
<span
	bind:this={div}
	{...$$restProps}
	class="semi-important {$$restProps.class || ''}"><slot /></span
>

<style lang="scss">
	.semi-important {
		font-weight: 700;
		color: rebeccapurple;
	}
</style>
