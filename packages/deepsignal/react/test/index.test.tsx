// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// @ts-ignore
import { createElement } from "react";
import { createRoot, Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { useDeepSignal, type DeepSignal } from "deepsignal/react";

describe("deepsignal/react", () => {
	let scratch: HTMLDivElement;
	let root: Root;
	let render: Root["render"];

	beforeEach(async () => {
		scratch = document.createElement("div");
		document.body.appendChild(scratch);

		const realRoot = createRoot(scratch);
		root = {
			render: element => act(() => realRoot.render(element)),
			unmount: () => act(() => realRoot.unmount()),
		};

		render = root.render.bind(root);
	});

	afterEach(() => {
		act(() => root.unmount());
		scratch.remove();
	});

	describe("useDeepSignal", () => {
		it("should return a deep signal that is internally stable", async () => {
			const spy = sinon.spy();
			let state: DeepSignal<{ test?: string }>;

			function App() {
				spy();
				state = useDeepSignal({ test: "test" });
				return <p>{state.test}</p>;
			}

			// @ts-ignore
			await render(<App />);

			expect(scratch.textContent).to.equal("test");
			expect(spy).to.be.calledOnce;
			const stateAfterRender = state!;

			act(() => {
				state!.test = "updated";
			});

			expect(scratch.textContent).to.equal("updated");
			expect(spy).to.be.calledTwice;
			expect(stateAfterRender).to.equal(state!);
		});
	});
});
