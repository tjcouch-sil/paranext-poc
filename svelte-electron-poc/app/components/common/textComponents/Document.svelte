<script lang="ts">
	import Contents from "@components/common/textComponents/Contents.svelte";
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";

	export let id: string;
	// Can remove if we figure out typescript
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let body: any[]; // IContents;

	let div: HTMLElement;

	afterUpdate(() => {
		flash(div);
	});
</script>

<div bind:this={div} class="document" {id}>
	<Contents contents={body} />
</div>
