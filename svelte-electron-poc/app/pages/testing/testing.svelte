<script lang="ts">
	import Menu from "@components/common/menu/menu.svelte";
	import Footer from "@components/common/footer/footer.svelte";
	import { populateIds } from "@app/util/Util";
	import TextEditor from "@components/common/textComponents/TextEditor.svelte";
	/* import {
		type IContent,
		type IDocument,
	} from "@components/common/textComponents/TextComponentTypes"; */

	const doc /* : IDocument */ = populateIds({
		body: [
			{
				type: "component",
				subType: "SemiImportant",
				contents: [
					{
						type: "text",
						contents: "This is not editable",
					},
					{
						type: "element",
						subType: "br",
					},
				],
				contenteditable: false,
			},
			{
				type: "component",
				subType: "SemiImportant",
				contents: [
					{
						type: "text",
						contents: " Edi",
					},
				],
			},
			{
				type: "text",
				contents: "t me!",
			},
		],
	});
</script>

<Menu />

<TextEditor document={doc} />

<Footer />
