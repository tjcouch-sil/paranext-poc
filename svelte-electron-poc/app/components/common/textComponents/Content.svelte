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
	export let contenteditable = false;

	let div: HTMLElement;

	$: component = subType ? TextComponents[subType] : undefined;
	$: voidElement = subType && voidElements.includes(subType);
	$: thisContent = getContentById(id);
	$: {
		if (type === ContentTypes.Text) {
			if (thisContent && thisContent.contents !== contents) {
				thisContent.contents = contents;
			}
		}
	}

	const onInput = (e: any) => {
		const newText = e.target.textContent;
		if (thisContent && thisContent.contents !== newText) {
			thisContent.contents = newText;
		}
	};

	afterUpdate(() => {
		if (div) {
			flash(div, "Content");
		}
	});
</script>

{#if type === ContentTypes.Component}
	<svelte:component this={component} {id} {contenteditable} {...$$restProps}>
		<Contents {contents} {contenteditable} />
	</svelte:component>
{:else if type === ContentTypes.Element}
	{#if voidElement}
		<svelte:element
			this={subType}
			bind:this={div}
			{id}
			{contenteditable}
			{...$$restProps}
		/>
	{:else}
		<svelte:element
			this={subType}
			bind:this={div}
			{id}
			{contenteditable}
			{...$$restProps}
		>
			<Contents {contents} {contenteditable} />
		</svelte:element>
	{/if}
{:else if type === ContentTypes.Text}
	{#if contenteditable}
		<span
			bind:this={div}
			bind:textContent={contents}
			{id}
			contenteditable
			{...$$restProps}
		/>
	{:else}
		<span bind:this={div} {id} {...$$restProps}>
			{contents}
		</span>
	{/if}
{:else}
	<!-- Potentially ContentTypes.Unknown -->
	Content provided unsupported type
{/if}
