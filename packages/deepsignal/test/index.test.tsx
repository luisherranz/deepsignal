// @ts-ignore: createElement needs to be on the scope
import { createElement, createRef, render } from "preact";
import { setupRerender } from "preact/test-utils";
import { deepSignal, useDeepSignal, type DeepSignal } from "deepsignal";

describe("deepsignal (preact)", () => {
	let scratch: HTMLDivElement;
	let rerender: () => void;

	const window = globalThis as any;

	beforeEach(() => {
		scratch = window.document.createElement("div");
		rerender = setupRerender();
	});

	afterEach(() => {
		render(null, scratch);
	});

	describe("direct signal bindigns", () => {
		it("should update deepSignal-based Text (no parent component)", () => {
			const state = deepSignal({ test: "test" });
			render(<span>{state.$test}</span>, scratch);

			const text = scratch.firstChild!.firstChild!;
			expect(text).to.have.property("data", "test");

			state.test = "changed";

			// should not remount/replace Text
			expect(scratch.firstChild!.firstChild!).to.equal(text);
			// should update the text in-place
			expect(text).to.have.property("data", "changed");
		});

		it("should update deepSignal-based Text (in a parent component)", async () => {
			const state = deepSignal({ test: "test" });
			const spy = sinon.spy();
			function App({ x }: { x: typeof state["$test"] }) {
				spy();
				return <span>{x}</span>;
			}
			render(<App x={state.$test} />, scratch);
			spy.resetHistory();

			const text = scratch.firstChild!.firstChild!;
			expect(text).to.have.property("data", "test");

			state.test = "changed";

			// Should not remount/replace Text.
			expect(scratch.firstChild!.firstChild!).to.equal(text);
			// Should update the text in-place.
			expect(text).to.have.property("data", "changed");

			expect(spy).not.to.have.been.called;
		});

		it("should update props without re-rendering", async () => {
			const state = deepSignal({ test: "initial" });
			const spy = sinon.spy();
			function Wrap() {
				spy();
				return <input value={state.$test as unknown as string} />;
			}
			render(<Wrap />, scratch);
			spy.resetHistory();

			expect(scratch.firstChild).to.have.property("value", "initial");

			state.test = "updated";

			expect(scratch.firstChild).to.have.property("value", "updated");

			// Ensure the component was never re-rendered: (even after a tick).
			expect(spy).not.to.have.been.called;

			state.test = "second update";

			expect(scratch.firstChild).to.have.property("value", "second update");

			// Ensure the component was never re-rendered: (even after a tick).
			expect(spy).not.to.have.been.called;
		});
	});

	describe("component bindings", () => {
		it("should subscribe to deepSignals", () => {
			const state = deepSignal({ test: "foo" });

			function App() {
				return <p>{state.test}</p>;
			}

			render(<App />, scratch);
			expect(scratch.textContent).to.equal("foo");

			state.test = "bar";
			rerender();
			expect(scratch.textContent).to.equal("bar");
		});

		it("should not subscribe to unrelated deepSignals", () => {
			const state = deepSignal({ test: "foo", unrelated: "bar" });

			const spy = sinon.spy();
			function App() {
				spy();
				return <p>{state.test}</p>;
			}

			render(<App />, scratch);
			expect(spy).to.be.calledOnce;

			state.unrelated = "baz";
			rerender();
			expect(spy).to.be.calledOnce;
		});

		it("should not subscribe to child signals", () => {
			const state = deepSignal({ test: "foo" });

			function Child() {
				return <p>{state.test}</p>;
			}

			const spy = sinon.spy();
			function App() {
				spy();
				return <Child />;
			}

			render(<App />, scratch);
			expect(scratch.textContent).to.equal("foo");

			state.test = "bar";
			rerender();
			expect(spy).to.be.calledOnce;
		});
	});

	describe("useDeepSignal", () => {
		it("should return a deep signal that is internally stable", async () => {
			const ref = createRef();
			const spy = sinon.spy();
			let state: DeepSignal<{ test?: string }>;

			function App() {
				spy();
				state = useDeepSignal({ test: "test" });
				return <p ref={ref}>{state.test}</p>;
			}

			render(<App />, scratch);

			expect(scratch.textContent).to.equal("test");
			expect(spy).to.be.calledOnce;
			const stateAfterRender = state!;

			state!.test = "updated";
			rerender();

			expect(scratch.textContent).to.equal("updated");
			expect(spy).to.be.calledTwice;
			expect(stateAfterRender).to.equal(state!);
		});
	});
});
