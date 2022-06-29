<script lang="ts">
	import Document from "./Document.svelte";
	import Important from "./Important.svelte";
	import SemiImportant from "./SemiImportant.svelte";

	export let id: string;
	export let type: string;
	export let subType: string;
	export let contents: any;

	$: component = { Important, SemiImportant }[subType];
</script>

{#if type == "component"}
	<svelte:component this={component} {id} {...$$restProps} >
		{#if contents}
			<Document id={contents.id} contents={contents.contents}></Document>
		{/if}
	</svelte:component>
{:else if type == "element"}
	<svelte:element this={subType} {id} {..A4.$$restProps} >
	</svelte:element>
{:else}
	{contents}
{/if}
