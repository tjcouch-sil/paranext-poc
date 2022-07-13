<script lang="ts">
	import Menu from "@components/common/menu/menu.svelte";
	import Footer from "@components/common/footer/footer.svelte";
	import { populateDocumentIds, setDocument } from "@app/util/Util";
	import TextEditor from "@components/common/textComponents/TextEditor.svelte";
	import {
		ContentTypes,
		type IContentComponent,
		type IDocument,
	} from "@components/common/textComponents/TextComponentTypes";
	import type { Writable } from "svelte/store";

	let showJson = true;

	const doc: Writable<IDocument> = setDocument(
		populateDocumentIds({
			contenteditable: true,
			body: [
				{
					type: ContentTypes.Component,
					subType: "Important",
					contents: [
						{
							type: ContentTypes.Text,
							contents: "This is not editable",
						},
						{
							type: ContentTypes.Element,
							subType: "br",
						},
					],
					verseApproved: false,
					contenteditable: false,
					class: "underlined",
				},
				{
					type: ContentTypes.Component,
					subType: "SemiImportant",
					contents: [
						{
							type: ContentTypes.Text,
							contents: "Edi",
						},
					],
				},
				{
					type: ContentTypes.Text,
					contents: "t me!",
					verseApproved: false,
				},
				{
					type: ContentTypes.Element,
					subType: "br",
				},
				{
					type: ContentTypes.Element,
					subType: "span",
					contents: "Text here",
				},
				{
					type: ContentTypes.Element,
					subType: "br",
				},
				{
					type: ContentTypes.Component,
					subType: "SemiImportant",
					contents: "This text is directly on the component!",
				},
				{
					type: ContentTypes.Element,
					subType: "div",
					contents: [
						{
							type: ContentTypes.Text,
							contents: "This verse is already approved!",
							verseApproved: true,
						},
					],
				},
			],
		}),
	);
</script>

<Menu />

<TextEditor document={doc} />
<button on:click={() => (showJson = !showJson)}>Toggle JSON</button>
{#if showJson}
	<pre><code>{JSON.stringify($doc, null, 2)}</code></pre>
{/if}
<Footer />
