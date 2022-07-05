<script lang="ts">
	import Menu from "@components/common/menu/menu.svelte";
	import Footer from "@components/common/footer/footer.svelte";
	import { populateIds, setDocument } from "@app/util/Util";
	import TextEditor from "@components/common/textComponents/TextEditor.svelte";
	import {
		ContentTypes,
		type IContentComponent,
		type IDocument,
	} from "@components/common/textComponents/TextComponentTypes";

	let showJson = true;

	const doc: IDocument = setDocument(
		populateIds({
			id: "",
			contenteditable: true,
			body: [
				{
					type: ContentTypes.Component,
					subType: "SemiImportant",
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
					contenteditable: false,
				} as IContentComponent,
				{
					type: ContentTypes.Component,
					subType: "SemiImportant",
					contents: [
						{
							type: ContentTypes.Text,
							contents: " Edi",
						},
					],
				},
				{
					type: ContentTypes.Text,
					contents: "t me!",
				},
			],
		}),
	);
</script>

<Menu />

<TextEditor document={doc} />
<button on:click={() => (showJson = !showJson)}>Toggle JSON</button>
{#if showJson}
	<pre><code>{JSON.stringify(doc, null, 2)}</code></pre>
{/if}
<Footer />
