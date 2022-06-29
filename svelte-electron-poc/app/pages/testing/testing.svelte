<script lang="ts">
	import Menu from "@components/common/menu/menu.svelte";
	import Footer from "@components/common/footer/footer.svelte";
	import Important from "@components/common/textComponents/Important.svelte";
	import SemiImportant from "@components/common/textComponents/SemiImportant.svelte";
	import Document from "@components/common/textComponents/Document.svelte";
	/* import {
		type IContent,
		type IDocument,
	} from "@components/common/textComponents/TextComponentTypes"; */

	let value = "Edit me";
	let html = "";

	const bS = "<b>";
	const bE = "</b>";
	const bold = () => {
		if (html.startsWith(bS)) {
			html = html.slice(bS.length, html.indexOf(bE));
		} else {
			html = `${bS}${html}${bE}`;
		}
	};

	const important = () => {
		/* console.log(
			"I can't figure out how to add a svelte component into contenteditable like this",
		); */
		const selection = window.getSelection();
		if (selection?.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			// selection.
		}
	};

	$: halfMark = Math.floor(value.length / 2);
	$: firstHalf = value.slice(0, halfMark);
	$: secondHalf = value.slice(halfMark);

	const type = (e: KeyboardEvent) => {
		const things = (e.target as HTMLInputElement)?.value;

		let range: Range;
		if (document.selection && document.selection.createRange) {
			range = document.selection.createRange();
			return range.htmlText;
		} else if (window.getSelection) {
			const selection = window.getSelection();
			if (selection.rangeCount > 0) {
				range = selection.getRangeAt(0);
				/* const clonedSelection = range.cloneContents();
				const div = document.createElement("div");
				div.appendChild(clonedSelection);
				return div.innerHTML; */
			} else {
				/* return ""; */
			}
		} else {
			/* return ""; */
		}
	};

	let doc = {
		id: "myDoc",
		contents: [
			{
				type: "component",
				subType: "SemiImportant",
				contents: [
					{
						type: "text",
						contents: "Edi",
					},
				],
			},
			{
				type: "text",
				contents: "t me!",
			},
		],
	};
</script>

<Menu />

<div class="inputdiv" contenteditable="true" on:keydown={type}>
	<!-- <Important>{firstHalf}</Important>{secondHalf} -->
	<Document {...doc} />
</div>
<button on:click={bold}>Bold</button>
<button on:click={important}>Important</button>
<div>textContent: {value}</div>
<div>firstHalf: {firstHalf}</div>
<div>secondHalf: {secondHalf}</div>
<div>
	innerHtml: {html}
</div>

<Footer />

<style lang="scss">
	.inputdiv {
		min-height: 5em;
		border: 1px solid black;
		border-radius: 10px;
	}
</style>
