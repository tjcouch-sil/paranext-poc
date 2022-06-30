<script lang="ts">
	import { isString } from "@app/util/Util";

	import Content from "./Content.svelte";

	// Can remove if we figure out typescript
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let contents: any[]; // IContents;
</script>

{#if contents}
	{#if isString(contents)}
		{contents}
	{:else}
		{#each contents as content, i (content.id || content || i)}
			<Content {...content} />
		{/each}
	{/if}
{/if}
