<script lang="ts">
	import Contents from "@components/common/textComponents/Contents.svelte";
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";
	import type { IContents } from "./TextComponentTypes";

	export let id: string | undefined = undefined;
	export let body: IContents;
	export let contenteditable = false;

	let div: HTMLElement;

	afterUpdate(() => {
		if (div) {
			flash(div);
		}
	});
</script>

<div bind:this={div} class="document" {id} {contenteditable}>
	<Contents contents={body} {contenteditable} />
</div>
