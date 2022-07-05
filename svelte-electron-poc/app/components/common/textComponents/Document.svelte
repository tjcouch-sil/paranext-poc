<script lang="ts">
	import Contents from "@components/common/textComponents/Contents.svelte";
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";
	import type { IContents } from "./TextComponentTypes";
	import { getContentById } from "@app/util/Util";

	export let id: string | undefined = undefined;
	export let body: IContents;
	export let contenteditable = false;

	let div: HTMLElement;

	/**
	 * Run commands on the document and prevent default ones
	 * @param e - keyboard event
	 */
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.ctrlKey || e.altKey || e.metaKey) {
			// Commands
		}
	};

	/**
	 * When a user types, we need to prevent replacing selections if there's a non-contenteditable element selected or inbetween
	 * TODO: If the user copies/pastes/drag-and-drops (DataTransfer), we need to figure out a way to transfer the svelte component info as well
	 * @param e - input event
	 */
	const onBeforeinput = (e: InputEvent) => {
		// TODO: implement
		// TODO: Handle Enter here?
	};

	/**
	 * When a user types something, we need to find where it is typed and update it.
	 * If the user selects something and types, we need to delete everything contenteditable between the selection.
	 * TODO: make sure this works with IME like emojis/Japanese and RTL like Arabic
	 * @param e - input event
	 */
	const onInput = (e: InputEvent) => {
		// Get the selection (or cursor position) and update the content
		const selection = window.getSelection()?.getRangeAt(0);
		if (selection) {
			const startElement = selection.startContainer?.parentElement;
			if (startElement) {
				const startContent = getContentById(startElement.id);
				if (
					startContent &&
					startContent.contents !== startElement.innerText
				) {
					// TODO: Confirm we don't want textContent https://stackoverflow.com/questions/35213147/difference-between-textcontent-vs-innertext
					startContent.contents = startElement.innerText;
				}
			}
			// It is a selection, not just a cursor position. Update the end element as well (OnDestroy will destroy the intermediate elements)
			if (!selection.collapsed) {
				const endElement = selection.endContainer?.parentElement;
				if (endElement) {
					const endContent = getContentById(endElement.id);
					if (
						endContent &&
						endContent.contents !== endElement.innerText
					) {
						// TODO: Confirm we don't want textContent https://stackoverflow.com/questions/35213147/difference-between-textcontent-vs-innertext
						endContent.contents = endElement.innerText;
					}
				}
			}
		}
	};

	afterUpdate(() => {
		if (div) {
			flash(div);
		}
	});
</script>

<div
	bind:this={div}
	class="document"
	{id}
	{contenteditable}
	on:keydown={onKeyDown}
	on:beforeinput={onBeforeinput}
	on:input={onInput}
>
	<Contents contents={body} {contenteditable} />
</div>
