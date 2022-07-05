<script lang="ts">
	import { isString } from "@app/util/Util";

	import Content from "./Content.svelte";
	import type { IContents, IContent } from "./TextComponentTypes";

	export let contents: IContents;
	export let contenteditable = false;

	$: contentsContent = contents as IContent[];
</script>

{#if contents}
	{#if isString(contents)}
		{contents}
	{:else}
		{#each contentsContent as content, i (content.id || content || i)}
			<Content {contenteditable} {...content} />
		{/each}
	{/if}
{/if}
