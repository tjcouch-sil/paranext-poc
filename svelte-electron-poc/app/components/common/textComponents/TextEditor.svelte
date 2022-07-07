<script lang="ts">
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";
	import Document from "./Document.svelte";
	import type { IDocument } from "./TextComponentTypes";
	import { destroyContentAtRandom } from "@app/util/Util";

	export let document: IDocument;

	let div: HTMLElement;
	let html = "Stuff and things";

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
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			// selection.
		}
	};

	const destroyRandom = () => {
		destroyContentAtRandom();
		// Refreshes the whole document. Not efficient
		document = document;
	};

	const onKeyDown = (e: KeyboardEvent) => {
		const things = (e.target as HTMLInputElement)?.value;

		let range: Range;
		if (window.getSelection) {
			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
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

	const onInput = (e: unknown) => {};

	afterUpdate(() => {
		if (div) {
			flash(div, "TextEditor");
		}
	});
</script>

<div
	bind:this={div}
	id="textEditor"
	class="inputdiv"
	on:keydown={onKeyDown}
	on:input={onInput}
>
	{#if document}
		<Document {...document} />
	{:else}
		Text Editor
	{/if}
</div>
<button on:click={bold}>Bold</button>
<button on:click={important}>Important</button>
<button on:click={destroyRandom}>Destroy Random</button>

<style lang="scss">
	.inputdiv {
		min-height: 5em;
		border: 1px solid black;
		border-radius: 10px;
	}
</style>
