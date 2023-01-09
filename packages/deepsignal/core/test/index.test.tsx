import { Signal, effect } from "@preact/signals-core";
import { deepSignal, peek } from "deepsignal/core";

describe("deepsignal/core", () => {
	let nested = { b: 2 };
	let array = [3, nested];
	let state = { a: 1, nested, array };
	let store = deepSignal(state);

	const window = globalThis as any;

	beforeEach(() => {
		nested = { b: 2 };
		array = [3, nested];
		state = { a: 1, nested, array };
		store = deepSignal(state);
	});

	describe("get - plain", () => {
		it("should return plain objects/arrays", () => {
			expect(store.nested).to.deep.equal({ b: 2 });
			expect(store.array).to.deep.equal([3, { b: 2 }]);
			expect(store.array[1]).to.deep.equal({ b: 2 });
		});

		it("should return plain primitives", () => {
			expect(store.a).to.equal(1);
			expect(store.nested.b).to.equal(2);
			expect(store.array[0]).to.equal(3);
			expect(typeof store.array[1] === "object" && store.array[1].b).to.equal(
				2
			);
			expect(store.array.length).to.equal(2);
		});

		it("should support reading from getters", () => {
			const store = deepSignal({
				counter: 1,
				get double() {
					return store.counter * 2;
				},
			});
			expect(store.double).to.equal(2);
			store.counter = 2;
			expect(store.double).to.equal(4);
		});

		it("should support getters returning other parts of the state", () => {
			const store = deepSignal({
				switch: "a",
				a: { data: "a" },
				b: { data: "b" },
				get aOrB() {
					return store.switch === "a" ? store.a : store.b;
				},
			});
			expect(store.aOrB.data).to.equal("a");
			store.switch = "b";
			expect(store.aOrB.data).to.equal("b");
		});
	});

	describe("get - signals ($)", () => {
		it("should return signal instance when using $prop", () => {
			expect(store.$a).to.be.instanceOf(Signal);
			expect(store.$a!.value).to.equal(1);
			expect(store.$nested).to.be.instanceOf(Signal);
			expect(store.$nested!.value.b).to.equal(2);
			expect(store.nested.$b).to.be.instanceOf(Signal);
			expect(store.nested.$b!.value).to.equal(2);
		});

		it("should return signal instance when accessing $[x] in arrays", () => {
			expect(store.$array).to.be.instanceOf(Signal);
			expect(store.$array!.value[0]).to.equal(3);
			expect(store.array.$![0]).to.be.instanceOf(Signal);
			expect(store.array.$![0].value).to.equal(3);
			expect(store.array.$![1]).to.be.instanceOf(Signal);
			expect(
				typeof store.array.$![1].value === "object" && store.array.$![1].value.b
			).to.equal(2);
			expect(
				typeof store.array[1] === "object" && store.array[1].$b
			).to.be.instanceOf(Signal);
			expect(
				typeof store.array[1] === "object" && store.array[1].$b!.value
			).to.equal(2);
		});

		it("should return length signal in arrays using $length", () => {
			expect(store.array.$length).to.be.instanceOf(Signal);
			expect(store.array.$length!.value).to.equal(2);
		});

		it("should not return signals in arrays using $prop", () => {
			expect((store.array as any).$0).to.be.undefined;
		});

		it("should support reading signals from getters", () => {
			const store = deepSignal({
				counter: 1,
				get double() {
					return store.counter * 2;
				},
			});
			expect(store.$double!.value).to.equal(2);
			store.counter = 2;
			expect(store.$double!.value).to.equal(4);
		});

		it("should support reading signals from getters returning other parts of the state", () => {
			const store = deepSignal({
				switch: "a",
				a: { data: "a" },
				b: { data: "b" },
				get aOrB() {
					return store.switch === "a" ? store.a : store.b;
				},
			});
			expect(store.aOrB.$data!.value).to.equal("a");
			store.switch = "b";
			expect(store.aOrB.$data!.value).to.equal("b");
		});
	});

	describe("set", () => {
		it("should update like plain objects/arrays", () => {
			expect(store.a).to.equal(1);
			expect(store.nested.b).to.equal(2);
			store.a = 2;
			store.nested.b = 3;
			expect(store.a).to.equal(2);
			expect(store.nested.b).to.equal(3);
		});

		it("should update array length", () => {
			expect(store.array.length).to.equal(2);
			store.array.push(4);
			expect(store.array.length).to.equal(3);
			store.array.splice(1, 2);
			expect(store.array.length).to.equal(1);
		});

		it("should update array $length", () => {
			expect(store.array.$length!.value).to.equal(2);
			store.array.push(4);
			expect(store.array.$length!.value).to.equal(3);
			store.array.splice(1, 2);
			expect(store.array.$length!.value).to.equal(1);
		});

		it("should update when mutations happen", () => {
			expect(store.a).to.equal(1);
			store.a = 11;
			expect(store.a).to.equal(11);
		});

		it("should support setting getters on the fly", () => {
			const store = deepSignal<{ counter: number; double?: number }>({
				counter: 1,
			});
			Object.defineProperty(store, "double", {
				get: function () {
					return store.counter * 2;
				},
			});
			expect(store.double).to.equal(2);
			store.counter = 2;
			expect(store.double).to.equal(4);
		});

		it("should throw when mutating the $ properties", () => {
			expect(() => ((store.nested as any).$b = 2)).to.throw();
			expect(() => ((store.array as any).$length = 2)).to.throw();
		});

		it("should throw when trying to mutate the signals array", () => {
			expect(() => ((store.array.$ as any)[0] = 2)).to.throw();
		});
	});

	describe("computations", () => {
		it("should trigger effects after mutations happen", () => {
			let x;
			effect(() => {
				x = store.a;
			});
			expect(x).to.equal(1);
			store.a = 11;
			expect(x).to.equal(11);
		});

		it("should trigger subscriptions after mutations happen", () => {
			let x;
			store.$a!.subscribe(() => {
				x = store.a;
			});
			expect(x).to.equal(1);
			store.a = 11;
			expect(x).to.equal(11);
		});

		it("should subscribe corretcly from getters", () => {
			let x;
			const store = deepSignal({
				counter: 1,
				get double() {
					return store.counter * 2;
				},
			});
			effect(() => (x = store.double));
			expect(x).to.equal(2);
			store.counter = 2;
			expect(x).to.equal(4);
		});

		it("should subscribe corretcly from getters returning other parts of the store", () => {
			let data;
			const store = deepSignal({
				switch: "a",
				a: { data: "a" },
				b: { data: "b" },
				get aOrB() {
					return store.switch === "a" ? store.a : store.b;
				},
			});
			effect(() => (data = store.aOrB.data));
			expect(data).to.equal("a");
			store.switch = "b";
			expect(data).to.equal("b");
		});

		it("should subscribe to changes", () => {
			const spy1 = sinon.spy(() => store.a);
			const spy2 = sinon.spy(() => store.nested);
			const spy3 = sinon.spy(() => store.nested.b);
			const spy4 = sinon.spy(() => store.array[0]);
			const spy5 = sinon.spy(
				() => typeof store.array[1] === "object" && store.array[1].b
			);

			effect(spy1);
			effect(spy2);
			effect(spy3);
			effect(spy4);
			effect(spy5);

			expect(spy1).callCount(1);
			expect(spy2).callCount(1);
			expect(spy3).callCount(1);
			expect(spy4).callCount(1);
			expect(spy5).callCount(1);

			store.a = 11;

			expect(spy1).callCount(2);
			expect(spy2).callCount(1);
			expect(spy3).callCount(1);
			expect(spy4).callCount(1);
			expect(spy5).callCount(1);

			store.nested.b = 22;

			expect(spy1).callCount(2);
			expect(spy2).callCount(1);
			expect(spy3).callCount(2);
			expect(spy4).callCount(1);
			expect(spy5).callCount(2); // nested also exists array[1]

			store.nested = { b: 222 };

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(1);
			expect(spy5).callCount(2); // now store.nested has a different reference

			store.array[0] = 33;

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(2);
			expect(spy5).callCount(2);

			if (typeof store.array[1] === "object") store.array[1].b = 2222;

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(2);
			expect(spy5).callCount(3);

			store.array[1] = { b: 22222 };

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(2);
			expect(spy5).callCount(4);

			store.array.push(4);

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(2);
			expect(spy5).callCount(4);

			store.array[3] = 5;

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(2);
			expect(spy5).callCount(4);

			store.array = [333, { b: 222222 }];

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(3);
			expect(spy5).callCount(5);
		});

		it("should subscribe to array length", () => {
			const array = [1];
			const store = deepSignal({ array });
			const spy1 = sinon.spy(() => store.array.length);
			const spy2 = sinon.spy(() => store.array.map((i: number) => i));

			effect(spy1);
			effect(spy2);
			expect(spy1).callCount(1);
			expect(spy2).callCount(1);

			store.array.push(2);
			expect(store.array.length).to.equal(2);
			expect(spy1).callCount(2);
			expect(spy2).callCount(2);

			store.array[2] = 3;
			expect(store.array.length).to.equal(3);
			expect(spy1).callCount(3);
			expect(spy2).callCount(3);

			store.array = store.array.filter((i: number) => i <= 2);
			expect(store.array.length).to.equal(2);
			expect(spy1).callCount(4);
			expect(spy2).callCount(4);
		});
	});

	describe("peek", () => {
		it("should return correct values when using peek()", () => {
			expect(peek(store, "a")).to.equal(1);
			expect(peek(store.nested, "b")).to.equal(2);
			expect(peek(store.array, 0)).to.equal(3);
			const nested = peek(store, "array")[1];
			expect(typeof nested === "object" && nested.b).to.equal(2);
			expect(peek(store.array, "length")).to.equal(2);
		});

		it("should not subscribe to changes when peeking", () => {
			const spy1 = sinon.spy(() => peek(store, "a"));
			const spy2 = sinon.spy(() => peek(store, "nested"));
			const spy3 = sinon.spy(() => peek(store, "nested").b);
			const spy4 = sinon.spy(() => peek(store, "array")[0]);
			const spy5 = sinon.spy(() => {
				const nested = peek(store, "array")[1];
				typeof nested === "object" && nested.b;
			});
			const spy6 = sinon.spy(() => peek(store, "array").length);

			effect(spy1);
			effect(spy2);
			effect(spy3);
			effect(spy4);
			effect(spy5);
			effect(spy6);

			expect(spy1).callCount(1);
			expect(spy2).callCount(1);
			expect(spy3).callCount(1);
			expect(spy4).callCount(1);
			expect(spy5).callCount(1);
			expect(spy6).callCount(1);

			store.a = 11;
			store.nested.b = 22;
			store.nested = { b: 222 };
			store.array[0] = 33;
			if (typeof store.array[1] === "object") store.array[1].b = 2222;
			store.array.push(4);

			expect(spy1).callCount(1);
			expect(spy2).callCount(1);
			expect(spy3).callCount(1);
			expect(spy4).callCount(1);
			expect(spy5).callCount(1);
			expect(spy6).callCount(1);
		});

		it("should subscribe to some changes but not other when peeking inside an object", () => {
			const spy1 = sinon.spy(() => peek(store.nested, "b"));
			effect(spy1);
			expect(spy1).callCount(1);
			store.nested.b = 22;
			expect(spy1).callCount(1);
			store.nested = { b: 222 };
			expect(spy1).callCount(2);
			store.nested.b = 2222;
			expect(spy1).callCount(2);
		});

		it("should support returning peek from getters", () => {
			const store = deepSignal({
				counter: 1,
				get double() {
					return store.counter * 2;
				},
			});
			expect(peek(store, "double")).to.equal(2);
			store.counter = 2;
			expect(peek(store, "double")).to.equal(4);
		});
	});

	describe("refs", () => {
		it("should preserve object references", () => {
			expect(store.nested).to.equal(store.array[1]);
			expect(store.nested.$b).to.equal(
				typeof store.array[1] === "object" && store.array[1].$b
			);

			store.nested.b = 22;

			expect(store.nested).to.equal(store.array[1]);
			expect(store.nested.$b).to.equal(
				typeof store.array[1] === "object" && store.array[1].$b
			);

			store.nested = { b: 222 };

			expect(store.nested).to.not.equal(store.array[1]);
			expect(store.nested.$b).to.not.equal(
				typeof store.array[1] === "object" && store.array[1].$b
			);
		});

		it("should return the same proxy if initialized more than once", () => {
			const state = {};
			const store1 = deepSignal(state);
			const store2 = deepSignal(state);
			expect(store1).to.equal(store2);
		});
	});

	describe("built-ins", () => {
		it("should throw when trying to deepsignal a built-in", () => {
			window.MyClass = class MyClass {};
			const obj = new window.MyClass();
			expect(() => deepSignal(obj)).to.throw();
		});

		it("should not wrap built-ins in proxies", () => {
			window.MyClass = class MyClass {};
			const obj = new window.MyClass();
			const store = deepSignal({ obj });
			expect(store.obj).to.equal(obj);
		});

		it("should not wrap elements in proxies", () => {
			const el = window.document.createElement("div");
			const store = deepSignal({ el });
			expect(store.el).to.equal(el);
		});

		it("should wrap global objects", () => {
			window.obj = { b: 2 };
			const store = deepSignal(window.obj);
			expect(store).to.not.equal(window.obj);
			expect(store).to.deep.equal({ b: 2 });
			expect(store.$b).to.be.instanceOf(Signal);
			expect(store.$b.value).to.equal(2);
		});

		it("should not wrap Date", () => {
			const date = new Date();
			const store = deepSignal({ date });
			expect(store.date).to.equal(date);
		});

		it("should not wrap RegExp", () => {
			const regex = new RegExp("");
			const store = deepSignal({ regex });
			expect(store.regex).to.equal(regex);
		});

		it("should not wrap Maps", () => {
			const map = new Map();
			const store = deepSignal({ map });
			expect(store.map).to.equal(map);
		});

		it("should not wrap Set", () => {
			const set = new Set();
			const store = deepSignal({ set });
			expect(store.set).to.equal(set);
		});

		it("should not wrap built-ins in proxies", () => {
			window.MyClass = class MyClass {};
			const obj = new window.MyClass();
			const store = deepSignal({ obj });
			expect(store.obj).to.equal(obj);
		});
	});

	describe("symbols", () => {
		it("should observe symbols", () => {
			const key = Symbol("key");
			let x;
			const store = deepSignal<{ [key: symbol]: any }>({});
			effect(() => (x = store[key]));

			expect(store[key]).to.equal(undefined);
			expect(x).to.equal(undefined);

			store[key] = true;

			expect(store[key]).to.equal(true);
			expect(x).to.equal(true);
		});

		it("should not observe well-known symbols", () => {
			const key = Symbol.isConcatSpreadable;
			let x;
			const state = deepSignal<{ [key: symbol]: any }>({});
			effect(() => (x = state[key]));

			expect(state[key]).to.equal(undefined);
			expect(x).to.equal(undefined);

			state[key] = true;
			expect(state[key]).to.equal(true);
			expect(x).to.equal(undefined);
		});
	});
});
