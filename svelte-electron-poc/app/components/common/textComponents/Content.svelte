<script lang="ts">
	import { getContentById, voidElements } from "@app/util/Util";
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";
	import Contents from "./Contents.svelte";
	import { TextComponents } from "./TextComponents";
	import { ContentTypes, type IContents } from "./TextComponentTypes";

	export let id: string | undefined = undefined;
	export let type: ContentTypes;
	export let subType: string | undefined = undefined;
	export let contents: IContents = undefined;

	let div: HTMLElement;

	$: component = subType ? TextComponents[subType] : undefined;
	$: voidElement = subType && voidElements.includes(subType);

	afterUpdate(() => {
		if (div) {
			flash(div, "Content");
		}
	});
</script>

{#if type === ContentTypes.Component}
	<svelte:component this={component} {id} {...$$restProps}>
		<Contents {contents} />
	</svelte:component>
{:else if type === ContentTypes.Element}
	{#if voidElement}
		<svelte:element this={subType} bind:this={div} {id} {...$$restProps} />
	{:else}
		<svelte:element this={subType} bind:this={div} {id} {...$$restProps}>
			<Contents {contents} />
		</svelte:element>
	{/if}
{:else if type === ContentTypes.Text}
	<span bind:this={div} {id} {...$$restProps}>
		{contents}
	</span>
{:else}
	<!-- Potentially ContentTypes.Unknown -->
	Content provided unsupported type
{/if}
