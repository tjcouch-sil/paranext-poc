// Taken from https://svelte.dev/tutorial/svelte-options
export default function flash(element: HTMLElement, readableName?: string) {
	console.log(
		`Update: ${readableName ? `${readableName}: ` : ""}${element.id}`,
	);
	requestAnimationFrame(() => {
		element.style.transition = "none";
		element.style.color = "rgba(255,62,0,1)";
		element.style.backgroundColor = "rgba(255,62,0,0.2)";

		setTimeout(() => {
			element.style.transition = "color 1s, background 1s";
			element.style.color = "";
			element.style.backgroundColor = "";
		});
	});
}
