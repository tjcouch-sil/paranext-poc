<script lang="ts">
	import { afterUpdate } from "svelte";
	import flash from "@app/transitions/flash";
	import Document from "./Document.svelte";
	import {
		ContentTypes,
		type IContent,
		type IContentComponent,
		type IContentElement,
		type IContents,
		type IDocument,
	} from "./TextComponentTypes";
	import {
		destroyContentAtRandom,
		getRandomContentId,
		isContentText,
		isString,
		newGuid,
		populateContentsIds,
		updateContentById,
	} from "@app/util/Util";
	import type { Writable } from "svelte/store";

	export let document: Writable<IDocument>;

	let div: HTMLElement;

	const important = () => {
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const element = range.startContainer?.parentElement;

			// Make what is selected is within one element
			// TODO: make this work between elements
			if (!element || element !== range.startContainer?.parentElement) {
				console.warn(
					"Important does not work on selections between elements yet!",
				);
				return;
			}
			updateContentById(element.id, (content) => {
				if (
					range.collapsed ||
					(range.startOffset === 0 &&
						range.endOffset === element.innerText.length)
				) {
					// If there is no selection but just content, wrap it in Important
					// TODO: change this to keeping track of a state so you can put in the Important when the user types?
					if (content.type !== ContentTypes.Text) {
						// Non-text content with text as its contents. Wrap content in Important
						content.contents = populateContentsIds([
							{
								type: ContentTypes.Component,
								subType: "Important",
								contents: content.contents,
							},
						]);
					} else {
						// Text content. Modify to Important
						const impContent =
							content as IContent as IContentComponent;
						impContent.type = ContentTypes.Component;
						impContent.subType = "Important";
					}
				} else {
					// If there is a selection, wrap just that part in Important
					const before = element.innerText.substring(
						0,
						range.startOffset,
					);
					const selected = element.innerText.substring(
						range.startOffset,
						range.endOffset,
					);
					const after = element.innerText.substring(
						range.endOffset,
						element.innerText.length,
					);

					const contents: IContents = [];
					if (before.length > 0) {
						contents.push({
							type: ContentTypes.Text,
							contents: before,
						});
					}
					contents.push({
						type: ContentTypes.Component,
						subType: "Important",
						contents: selected,
					});
					if (after.length > 0) {
						contents.push({
							type: ContentTypes.Text,
							contents: after,
						});
					}

					if (content.type !== ContentTypes.Text) {
						// Non-text content with text as its contents. Split up and wrap in contents
						content.contents = populateContentsIds(contents);
					} else {
						// Text content. Modify to span
						const impContent =
							content as IContent as IContentElement;
						impContent.type = ContentTypes.Element;
						impContent.subType = "span";
						impContent.contents = populateContentsIds(contents);
					}
				}
				return true;
			});
		}
	};

	const destroyRandom = () => {
		destroyContentAtRandom();
		// Refreshes the whole document. Not efficient
		// document = document;
	};

	const purpleRandom = () => {
		const purpleBorderStyle = "border: 1px solid purple";
		updateContentById(
			getRandomContentId(
				(content) =>
					isContentText(content) &&
					!(content.style as string | undefined)?.includes(
						purpleBorderStyle,
					),
			),
			(content) => {
				let changed = false;
				if (!content.style) {
					content.style = purpleBorderStyle;
					changed = true;
				} else if (
					!(content.style as string).includes(purpleBorderStyle)
				) {
					content.style += purpleBorderStyle;
					changed = true;
				}

				if (changed) {
					console.log(`Purple: ${content.id}`);
				}
				return changed;
			},
		);
	};

	/**
	 * Run commands on the document and prevent default ones
	 * @param e keyboard event
	 */
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.ctrlKey || e.metaKey) {
			switch (e.key) {
				case "i":
					important();
					e.preventDefault();
					break;
				case "d":
					destroyRandom();
					e.preventDefault();
					break;
				case "p":
					purpleRandom();
					e.preventDefault();
					break;
			}

			// Commands
			// TODO: undo
			// TODO: redo
		}
	};

	afterUpdate(() => {
		if (div) {
			flash(div, "TextEditor");
		}
	});
</script>

<div bind:this={div} id="textEditor" class="inputdiv" on:keydown={onKeyDown}>
	{#if document}
		<Document {...$document} />
	{:else}
		Text Editor
	{/if}
</div>
<button on:click={important}><span class="underlined">I</span>mportant</button>
<button on:click={destroyRandom}
	><span class="underlined">D</span>estroy Random</button
>
<button on:click={purpleRandom}
	><span class="underlined">P</span>urple Random</button
>

<style lang="scss">
	.inputdiv {
		min-height: 5em;
		border: 1px solid black;
		border-radius: 10px;
	}

	:global(.underlined) {
		text-decoration: underline;
	}
</style>
