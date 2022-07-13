<script lang="ts">
	import Contents from "@components/common/textComponents/Contents.svelte";
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";
	import type { IContents } from "./TextComponentTypes";
	import { updateContentsById } from "@app/util/Util";

	export let id: string | undefined = undefined;
	export let body: IContents;
	export let contenteditable = false;

	let div: HTMLElement;

	/**
	 * Contains selection info before an input happens for use in updating the document.
	 * Contains the location of the selection before the input happens (before text is deleted).
	 * Set in onBeforeinput, used in onInput
	 */
	let inputSelection: StaticRange | undefined;

	/**
	 * When a user types, we need to prevent replacing selections if there's a non-contenteditable element selected or inbetween
	 * @param e input event
	 */
	const onBeforeinput = (e: InputEvent) => {
		// Save the selection so we can update the start and end containers in onInput
		const targetRanges = e.getTargetRanges();
		if (targetRanges?.length > 0) {
			inputSelection = targetRanges[0];
		}
		/* During the input event, windowSelection contains the location of the cursor after the input happens (after text is deleted).
		   Maybe this will be useful later, so leaving this here for now.
		const windowSel = window.getSelection();
		if (windowSel && windowSel.rangeCount > 0) {
			windowSelection = windowSel.getRangeAt(0);
		}
		*/

		// TODO: Handle Enter here? And other special inputTypes? https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
		// TODO: Prevent replacing selections if there is a non-editable element selected or inbetween?
		// TODO: figure out copy/paste/drag-and-drop (DataTransfer) svelte component info
	};

	/**
	 * When a user types something, we need to find where it is typed and update it.
	 * If the user selects something and types, we need to delete everything contenteditable between the selection.
	 * Note: unfortunately, we cannot bind:textContent or on:input in Content.svelte because html only creates events
	 * for the highest contenteditable element in the hierarchy. The cursor and selection do not work between contenteditable elements
	 * if their parent is not also contenteditable, so we pretty much have to work with this top-level Document input event.
	 * Since svelte components themselves do not appear in the DOM, we have to use the selected DOM elements to find the appropriate
	 * Content to change in the document data.
	 * TODO: make sure this works with IME like emojis/Japanese and RTL like Arabic
	 */
	const onInput = (/* e: Event */) => {
		// Get the selection (or cursor position) and update the content
		// TODO: remove the content between the two selected elements if there is any
		if (inputSelection) {
			const startElement = inputSelection.startContainer?.parentElement;
			if (startElement) {
				// TODO: Confirm we don't want textContent https://stackoverflow.com/questions/35213147/difference-between-textcontent-vs-innertext
				updateContentsById(startElement.id, startElement.innerText);
			}
			// It is a selection, not just a cursor position. Update the end element as well (OnDestroy will destroy the intermediate elements)
			if (!inputSelection.collapsed) {
				const endElement = inputSelection.endContainer?.parentElement;
				if (endElement) {
					// TODO: Confirm we don't want textContent https://stackoverflow.com/questions/35213147/difference-between-textcontent-vs-innertext
					updateContentsById(endElement.id, endElement.innerText);
				}
			}
		}
	};

	const onCompositionend = (e: CompositionEvent) => {
		// When you first enter text using an IME after loading the page, onBeforeinput and onCompositionend run,
		// but onInput doesn't run. Some actions like deleting a character fix the problem, but it continues until
		// certain actions occur. Maybe we could spoof an input event or just add the e.data to the text manually.
		// We should probably figure out if this is an electron, svelte, or other issue and file it. See inputType-test.html
		// TODO: fix missing first IME input
		const imeInput = e.data;
		console.log(imeInput);
	};

	afterUpdate(() => {
		if (div) {
			flash(div, "Document");
		}
	});
</script>

<div
	bind:this={div}
	class="document"
	{id}
	{contenteditable}
	on:beforeinput={onBeforeinput}
	on:input={onInput}
	on:compositionend={onCompositionend}
>
	<Contents contents={body} />
</div>
