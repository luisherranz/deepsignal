import { deepSignal } from "deepsignal";
import { Signal, effect } from "@preact/signals-core";

describe("deepsignal", () => {
	let nested = { b: 2 };
	let array = [3, nested];
	let v = { a: 1, nested, array };
	let s = deepSignal(v);

	beforeEach(() => {
		nested = { b: 2 };
		array = [3, nested];
		v = { a: 1, nested, array };
		s = deepSignal(v);
	});

	it("should return like plain objects/arrays", () => {
		expect(s.a).to.equal(1);
		expect(s.nested.b).to.equal(2);
		expect(s.array[0]).to.equal(3);
		expect(typeof s.array[1] === "object" && s.array[1].b).to.equal(2);
		expect(s.array.length).to.equal(2);
	});

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

	it("should return signal instance when using $", () => {
		expect(s.$a).to.be.instanceOf(Signal);
		expect(s.$a!.value).to.equal(1);
		expect(s.$nested).to.be.instanceOf(Signal);
		expect(s.$nested!.value.b).to.equal(2);
		expect(s.nested.$b).to.be.instanceOf(Signal);
		expect(s.nested.$b!.value).to.equal(2);
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
		expect(typeof s.array[1] === "object" && s.array[1].$b!.value).to.equal(2);
		expect(s.array.$length).to.be.instanceOf(Signal);
		expect(s.array.$length!.value).to.equal(2);
	});

	it("should return peek when using $$", () => {
		expect(s.$$a).to.equal(1);
		expect(s.$$nested!.b).to.equal(2);
		expect(s.nested.$$b).to.equal(2);
		expect(s.$$array![0]).to.equal(3);
		expect(s.array.$$![0]).to.equal(3);
		expect(typeof s.$$array![1] === "object" && s.$$array![1].b).to.equal(2);
		expect(typeof s.array.$$![1] === "object" && s.array.$$![1].b).to.equal(2);
		expect(s.$$array!.length).to.equal(2);
		expect(s.array.$$length).to.equal(2);
	});

	it("should update array $length", () => {
		expect(s.array.$length!.value).to.equal(2);
		s.array.push(4);
		expect(s.array.$length!.value).to.equal(3);
		s.array.splice(1, 2);
		expect(s.array.$length!.value).to.equal(1);
	});

	it("should not return signals in plain arrays using $prop", () => {
		expect((s.array as any).$0).to.be.undefined;
	});

	it("should update when mutations happen", () => {
		const a = { x: 1 };
		const sa = deepSignal(a);
		expect(sa.x).to.equal(1);
		sa.x = 11;
		expect(sa.x).to.equal(11);
	});

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
		const a = { x: 1 };
		const b = { a };
		const sa = deepSignal(a);
		const sb = deepSignal(b);
		const spya = sinon.spy(() => sa.x);
		const spyb = sinon.spy(() => sb.a.x);

		effect(spya);
		effect(spyb);

		expect(spya).callCount(1);
		expect(spyb).callCount(1);

		sa.x = 11;

		expect(spya).callCount(2);
		expect(spyb).callCount(2);

		sb.a = { x: 111 };

		expect(spya).callCount(2);
		expect(spyb).callCount(3);

		sb.a.x = 1111;

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

	it("should preserve object references", () => {
		const nested = { b: { c: 2 } };
		const array = [3, nested];
		const v = { a: 1, nested, array };

		const s1 = deepSignal(nested);
		const s2 = deepSignal(array);
		const s3 = deepSignal(v);

		expect(s3.nested).to.equal(s1);
		expect(s3.nested.b).to.equal(s1.b);
		expect(s3.array).to.equal(s2);
		expect(s3.array[1]).to.equal(s2[1]);
		expect(s3.array[1]).to.equal(s1);
		expect(typeof s3.array[1] === "object" && s3.array[1].b).to.equal(s1.b);

		nested.b = { c: 3 };

		expect(s3.nested.b).to.equal(s1.b);
		expect(typeof s3.array[1] === "object" && s3.array[1].b).to.equal(s1.b);
	});
});
