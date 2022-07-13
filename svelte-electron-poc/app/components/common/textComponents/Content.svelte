<script lang="ts">
	import { getContentById, voidElements } from "@app/util/Util";
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";
	import Contents from "./Contents.svelte";
	import { TextComponents } from "./TextComponents";
	import {
		ContentTypes,
		type IAnnotations,
		type IContents,
	} from "./TextComponentTypes";
	import { AnnotationDefinitions } from "./annotations/AnnotationDefinitions";

	export let id: string | undefined = undefined;
	export let annotations: IAnnotations = undefined;
	export let type: ContentTypes;
	export let subType: string | undefined = undefined;
	export let contents: IContents = undefined;

	let div: HTMLElement;

	$: component = subType ? TextComponents[subType] : undefined;
	$: annotationDefinitions =
		annotations && annotations.length > 0
			? annotations.map(
					(annotation) => AnnotationDefinitions[annotation.type],
			  )
			: undefined;
	$: voidElement = subType && voidElements.includes(subType);

	afterUpdate(() => {
		if (div) {
			flash(div, "Content");
		}
	});
</script>

<!-- TODO: consider alternative solutions to spread operators https://stackoverflow.com/questions/64805298/using-spread-properties-versus-the-whole-object-when-passing-data-to-a-component -->
<!-- TODO: separate the annotation into its own component - can probably render the first element in annotations array then <svelte:self><slot /></svelte:self> recursively -->
{#if annotations && annotationDefinitions && annotationDefinitions.length > 0}
	<svelte:component
		this={annotationDefinitions[0].component}
		{...annotationDefinitions[0]}
		{...annotations[0]}
	>
		{#if type === ContentTypes.Component}
			<svelte:component this={component} {id} {...$$restProps}>
				<Contents {contents} />
			</svelte:component>
		{:else if type === ContentTypes.Element}
			{#if voidElement}
				<svelte:element
					this={subType}
					bind:this={div}
					{id}
					{...$$restProps}
				/>
			{:else}
				<svelte:element
					this={subType}
					bind:this={div}
					{id}
					{...$$restProps}
				>
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
	</svelte:component>
{:else if type === ContentTypes.Component}
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
