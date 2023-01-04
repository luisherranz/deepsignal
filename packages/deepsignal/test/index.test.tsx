import { deepSignal } from "deepsignal";
import { Signal, effect } from "@preact/signals-core";

describe("deepsignal", () => {
	let nested = { b: 2 };
	let array = [3, nested];
	let v = { a: 1, nested, array };
	let s = deepSignal(v);

	const window = globalThis as any;

	beforeEach(() => {
		nested = { b: 2 };
		array = [3, nested];
		v = { a: 1, nested, array };
		s = deepSignal(v);
	});

	describe("get", () => {
		it("should return plain objects/arrays", () => {
			expect(s.nested).to.deep.equal({ b: 2 });
			expect(s.array).to.deep.equal([3, { b: 2 }]);
			expect(s.array[1]).to.deep.equal({ b: 2 });
		});

		it("should return plain primitives", () => {
			expect(s.a).to.equal(1);
			expect(s.nested.b).to.equal(2);
			expect(s.array[0]).to.equal(3);
			expect(typeof s.array[1] === "object" && s.array[1].b).to.equal(2);
			expect(s.array.length).to.equal(2);
		});

		it("should return signal instance when using $prop", () => {
			expect(s.$a).to.be.instanceOf(Signal);
			expect(s.$a!.value).to.equal(1);
			expect(s.$nested).to.be.instanceOf(Signal);
			expect(s.$nested!.value.b).to.equal(2);
			expect(s.nested.$b).to.be.instanceOf(Signal);
			expect(s.nested.$b!.value).to.equal(2);
		});

		it("should return signal instance when accessing $[x] in arrays", () => {
			expect(s.$array).to.be.instanceOf(Signal);
			expect(s.$array!.value[0]).to.equal(3);
			expect(s.array.$![0]).to.be.instanceOf(Signal);
			expect(s.array.$![0].value).to.equal(3);
			expect(s.array.$![1]).to.be.instanceOf(Signal);
			expect(
				typeof s.array.$![1].value === "object" && s.array.$![1].value.b
			).to.equal(2);
			expect(typeof s.array[1] === "object" && s.array[1].$b).to.be.instanceOf(
				Signal
			);
			expect(typeof s.array[1] === "object" && s.array[1].$b!.value).to.equal(
				2
			);
		});

		it("should return length signal in arrays using $length", () => {
			expect(s.array.$length).to.be.instanceOf(Signal);
			expect(s.array.$length!.value).to.equal(2);
		});

		it("should not return signals in arrays using $prop", () => {
			expect((s.array as any).$0).to.be.undefined;
		});
	});

	describe("set", () => {
		it("should update like plain objects/arrays", () => {
			expect(s.a).to.equal(1);
			expect(s.nested.b).to.equal(2);
			s.a = 2;
			s.nested.b = 3;
			expect(s.a).to.equal(2);
			expect(s.nested.b).to.equal(3);
		});

		it("should update array length", () => {
			expect(s.array.length).to.equal(2);
			s.array.push(4);
			expect(s.array.length).to.equal(3);
			s.array.splice(1, 2);
			expect(s.array.length).to.equal(1);
		});

		it("should update array $length", () => {
			expect(s.array.$length!.value).to.equal(2);
			s.array.push(4);
			expect(s.array.$length!.value).to.equal(3);
			s.array.splice(1, 2);
			expect(s.array.$length!.value).to.equal(1);
		});

		it("should update when mutations happen", () => {
			const a = { x: 1 };
			const sa = deepSignal(a);
			expect(sa.x).to.equal(1);
			sa.x = 11;
			expect(sa.x).to.equal(11);
		});
	});

	describe("subscribe", () => {
		it("should trigger effects after mutations happen", () => {
			const a = { x: 1 };
			const sa = deepSignal(a);
			let x;
			effect(() => {
				x = sa.x;
			});
			expect(x).to.equal(1);
			sa.x = 11;
			expect(x).to.equal(11);
		});

		it("should subscribe to changes", () => {
			const nested = { x: 1 };
			const a = { nested };
			const b = { nested };
			const sa = deepSignal(a);
			const sb = deepSignal(b);

			const spya = sinon.spy(() => sa.nested.x);
			const spyb = sinon.spy(() => sb.nested.x);

			effect(spya);
			effect(spyb);

			expect(spya).callCount(1);
			expect(spyb).callCount(1);

			sa.nested.x = 11;

			expect(spya).callCount(2);
			expect(spyb).callCount(2);

			sb.nested = { x: 111 };

			expect(spya).callCount(2);
			expect(spyb).callCount(3);

			sb.nested.x = 1111;

			expect(spya).callCount(2);
			expect(spyb).callCount(4);
		});

		it("should subscribe to changes (2)", () => {
			const spy1 = sinon.spy(() => s.a);
			const spy2 = sinon.spy(() => s.nested);
			const spy3 = sinon.spy(() => s.nested.b);
			const spy4 = sinon.spy(() => s.array[0]);
			const spy5 = sinon.spy(
				() => typeof s.array[1] === "object" && s.array[1].b
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

			s.a = 11;

			expect(spy1).callCount(2);
			expect(spy2).callCount(1);
			expect(spy3).callCount(1);
			expect(spy4).callCount(1);
			expect(spy5).callCount(1);

			s.nested.b = 22;

			expect(spy1).callCount(2);
			expect(spy2).callCount(1);
			expect(spy3).callCount(2);
			expect(spy4).callCount(1);
			expect(spy5).callCount(2); // nested also exists array[1]

			s.nested = { b: 222 };

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(1);
			expect(spy5).callCount(2); // now s.nested has a different reference

			s.array[0] = 33;

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(2);
			expect(spy5).callCount(2);

			if (typeof s.array[1] === "object") s.array[1].b = 2222;

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(2);
			expect(spy5).callCount(3);

			s.array[1] = { b: 22222 };

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(2);
			expect(spy5).callCount(4);

			s.array.push(4);

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(2);
			expect(spy5).callCount(4);

			s.array[3] = 5;

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(2);
			expect(spy5).callCount(4);

			s.array = [333, { b: 222222 }];

			expect(spy1).callCount(2);
			expect(spy2).callCount(2);
			expect(spy3).callCount(3);
			expect(spy4).callCount(3);
			expect(spy5).callCount(5);
		});

		it("should subscribe to array length", () => {
			const array = [1];
			const s = deepSignal({ array });
			const spy1 = sinon.spy(() => s.array.length);
			const spy2 = sinon.spy(() => s.array.map((i: number) => i));

			effect(spy1);
			effect(spy2);
			expect(spy1).callCount(1);
			expect(spy2).callCount(1);

			s.array.push(2);
			expect(s.array.length).to.equal(2);
			expect(spy1).callCount(2);
			expect(spy2).callCount(2);

			s.array[2] = 3;
			expect(s.array.length).to.equal(3);
			expect(spy1).callCount(3);
			expect(spy2).callCount(3);

			s.array = s.array.filter((i: number) => i <= 2);
			expect(s.array.length).to.equal(2);
			expect(spy1).callCount(4);
			expect(spy2).callCount(4);
		});
	});

	describe("peek", () => {
		it("should return peek when using $$", () => {
			expect(s.$$a).to.equal(1);
			expect(s.$$nested!.b).to.equal(2);
			expect(s.nested.$$b).to.equal(2);
			expect(s.$$array![0]).to.equal(3);
			expect(s.array.$$![0]).to.equal(3);
			expect(typeof s.$$array![1] === "object" && s.$$array![1].b).to.equal(2);
			expect(typeof s.array.$$![1] === "object" && s.array.$$![1].b).to.equal(
				2
			);
			expect(s.$$array!.length).to.equal(2);
			expect(s.array.$$length).to.equal(2);
		});

		it("should not subscribe to changes when peeking", () => {
			const spy1 = sinon.spy(() => s.$$a);
			const spy2 = sinon.spy(() => s.$$nested);
			const spy3 = sinon.spy(() => s.$$nested!.b);
			const spy4 = sinon.spy(() => s.$$array![0]);
			const spy5 = sinon.spy(() => {
				const nested = s.array.$$![1];
				if (typeof nested === "object") nested.b;
			});
			const spy6 = sinon.spy(() => s.array.$$length);

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

			s.a = 11;
			s.nested.b = 22;
			s.nested = { b: 222 };
			s.array[0] = 33;
			if (typeof s.array[1] === "object") s.array[1].b = 2222;
			s.array.push(4);

			expect(spy1).callCount(1);
			expect(spy2).callCount(1);
			expect(spy3).callCount(1);
			expect(spy4).callCount(1);
			expect(spy5).callCount(1);
			expect(spy6).callCount(1);
		});

		it("should subscribe to some changes but not other when peeking inside an object", () => {
			const spy1 = sinon.spy(() => s.nested.$$b);
			effect(spy1);
			expect(spy1).callCount(1);
			s.nested.b = 22;
			expect(spy1).callCount(1);
			s.nested = { b: 222 };
			expect(spy1).callCount(2);
			s.nested.b = 2222;
			expect(spy1).callCount(2);
		});
	});

	describe("refs", () => {
		it("should preserve object references", () => {
			let nested = { b: 2 };
			let array = [3, nested];
			let v = { a: 1, nested, array };
			let s = deepSignal(v);

			expect(s.nested).to.equal(s.array[1]);
			expect(s.nested.$b).to.equal(
				typeof s.array[1] === "object" && s.array[1].$b
			);

			s.nested.b = 22;

			expect(s.nested).to.equal(s.array[1]);
			expect(s.nested.$b).to.equal(
				typeof s.array[1] === "object" && s.array[1].$b
			);

			s.nested = { b: 222 };

			expect(s.nested).to.not.equal(s.array[1]);
			expect(s.nested.$b).to.not.equal(
				typeof s.array[1] === "object" && s.array[1].$b
			);
		});
	});

	describe("built-ins", () => {
		it("should not wrap built-ins in proxies", () => {
			window.MyClass = class MyClass {};
			const obj = new window.MyClass();
			const obs = deepSignal({ obj });
			expect(obs.obj).to.equal(obj);
		});

		it("should not wrap elements in proxies", () => {
			const el = window.document.createElement("div");
			const obs = deepSignal({ el });
			expect(obs.el).to.equal(el);
		});

		it("should wrap global objects", () => {
			window.obj = { b: 2 };
			const obs = deepSignal(window.obj);
			expect(obs).to.not.equal(window.obj);
			expect(obs).to.deep.equal({ b: 2 });
			expect(obs.$b).to.be.instanceOf(Signal);
			expect(obs.$b.value).to.equal(2);
		});

		it("should not wrap Date", () => {
			const date = new Date();
			const obs = deepSignal({ date });
			expect(obs.date).to.equal(date);
		});

		it("should not wrap RegExp", () => {
			const regex = new RegExp("");
			const obs = deepSignal({ regex });
			expect(obs.regex).to.equal(regex);
		});

		it("should not wrap Maps", () => {
			const map = new Map();
			const obs = deepSignal({ map });
			expect(obs.map).to.equal(map);
		});

		it("should not wrap Set", () => {
			const set = new Set();
			const obs = deepSignal({ set });
			expect(obs.set).to.equal(set);
		});

		it("should not wrap built-ins in proxies", () => {
			window.MyClass = class MyClass {};
			const obj = new window.MyClass();
			const obs = deepSignal({ obj });
			expect(obs.obj).to.equal(obj);
		});
	});

	describe("symbols", () => {
		it("should observe symbol keys", () => {
			const key = Symbol("key");
			let dummy;
			const obj = deepSignal<{ [key: symbol]: any }>({});
			effect(() => (dummy = obj[key]));

			expect(obj[key]).to.equal(undefined);
			expect(dummy).to.equal(undefined);

			obj[key] = true;
			expect(obj[key]).to.equal(true);
			expect(dummy).to.equal(true);
		});
	});
});
