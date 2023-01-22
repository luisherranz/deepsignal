// @ts-ignore-next-line
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { signal } from "@preact/signals-react";
import { createElement, useMemo, memo, StrictMode, createRef } from "react";
import { createRoot, Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { useDeepSignal, type DeepSignal } from "deepsignal";

const sleep = (ms?: number) => new Promise(r => setTimeout(r, ms));
signal(0);

describe("deepsignal/react", () => {
	let scratch: HTMLDivElement;
	let root: Root;
	function render(element: Parameters<Root["render"]>[0]) {
		act(() => root.render(element));
	}

	const window = globalThis as any;

	beforeEach(() => {
		scratch = window.document.createElement("div");
		root = createRoot(scratch);
	});

	afterEach(() => {
		act(() => root.unmount());
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

			render(<App />);

			expect(scratch.textContent).to.equal("test");
			expect(spy).to.be.calledOnce;
			const stateAfterRender = state!;

			await sleep(1);

			act(() => {
				state!.test = "updated";
			});

			expect(scratch.textContent).to.equal("updated");
			expect(spy).to.be.calledTwice;
			expect(stateAfterRender).to.equal(state!);
		});
	});
});
