<script lang="ts">
	import { isString } from "@app/util/Util";

	import Content from "./Content.svelte";
import type { IContents, IContent } from "./TextComponentTypes";

	export let contents: IContents;

	$: contentsContent = contents as IContent[];
</script>

{#if contents}
	{#if isString(contents)}
		{contents}
	{:else}
		{#each contentsContent as content, i (content.id || content || i)}
			<Content {...content} />
		{/each}
	{/if}
{/if}
