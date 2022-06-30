<script lang="ts">
	import { voidElements } from "@app/util/Util";
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";

	import Contents from "./Contents.svelte";
	import { TextComponents } from "./TextComponents";

	export let id: string;
	export let type: string;
	export let subType: string | undefined = undefined;
	// Can remove if we figure out typescript
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let contents: any = undefined; // IContents;

	let div: HTMLElement;

	// @ts-expect-error ts(7053) because svelte weirdness
	$: component = subType ? TextComponents[subType] : undefined;
	$: voidElement = subType && voidElements.includes(subType);

	afterUpdate(() => {
		if (div) {
			flash(div);
		}
	});
</script>

{#if type == "component"}
	<svelte:component this={component} bind:this={div} {id} {...$$restProps}>
		<Contents {contents} />
	</svelte:component>
{:else if type == "element"}
	{#if voidElement}
		<svelte:element this={subType} bind:this={div} {id} {...$$restProps} />
	{:else}
		<svelte:element this={subType} bind:this={div} {id} {...$$restProps}>
			<Contents {contents} />
		</svelte:element>
	{/if}
{:else if type == "text"}
	<span bind:this={div} {id} {...$$restProps}>
		{contents}
	</span>
{:else}
	Content provided unsupported type
{/if}
