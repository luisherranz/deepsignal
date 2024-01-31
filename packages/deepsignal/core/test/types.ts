import { signal, Signal } from "@preact/signals-core";
import { deepSignal, peek, shallow } from "../src";
import type { Shallow } from "../src";

// Arrays.
const array = deepSignal([{ a: 1 }, { a: 2 }]);
const a1: number = array.length;
const a2: Signal<number> = array.$length!;
const a3: number = peek(array, "length");
const a4: { a: number } = array[0];
const a5: Signal<{ a: number }> = array.$![0];
const a6: { a: number } = peek(array, 0);
const a7: number = array[0].a;
const a8: Signal<number> = array[0].$a!;
const a9: number = peek(array, 0).a;
const a10: number[] = array.map(item => item.a);
const a11: Signal<number>[] = array.map(item => item.$a!);
const a12 = array.forEach(item => item.$a);
const a13: Signal<number> = array.concat([{ a: 3 }])[0].$a!;
const a14: Signal<number> = array.concat({ a: 3 })[0].$a!;
const a15: Signal<number> = array.reverse()[0].$a!;
const a16: Signal<number> = array.shift()!.$a!;
const a17: Signal<number> = array.slice(0, 1)[0].$a!;
const a18: Signal<number> = array.sort()[0].$a!;
const a19: Signal<number> = array.splice(0, 1)[0].$a!;
const a20: Signal<number> = array.splice(0, 1, { a: 3 })[0].$a!;
const a21: Signal<number> = array.filter(item => !item.$a!)[0].$a!;
const a22: Signal<number> = array.reduce((prev, curr) =>
	prev.$a!.value > curr.$a!.value ? prev : curr
).$a!;
const a23: number = array.reduce((prev, curr) => prev + curr.$a!.value, 0);
const a24: Signal<number> = array.reduce(
	(prev, curr) => (prev.$a!.value > curr.$a!.value ? prev : curr),
	array[0]
).$a!;
const a25: Signal<number> = array.reduceRight((prev, curr) =>
	prev.$a!.value > curr.$a!.value ? prev : curr
).$a!;
const a26: number = array.reduceRight((prev, curr) => prev + curr.$a!.value, 0);
const a27: Signal<number> = array.reduceRight(
	(prev, curr) => (prev.$a!.value > curr.$a!.value ? prev : curr),
	{ a: 3 }
).$a!;
// @ts-expect-error
array.$0;

// Normal functions.
const store1 = deepSignal({
	value: 1,
	isBigger: (newValue: number): boolean => store1.value > newValue,
	sum(newValue: number): number {
		return store1.value + newValue;
	},
	valueSignal: (): Signal<number> => store1.$value!,
	nested: {
		toString: (): string => `${store1.value}`,
	},
});
const s1: boolean = store1.isBigger(2);
const s2: number = store1.sum(2);
const s3: Signal<number> = store1.valueSignal();
const s4: string = store1.toString();
// @ts-expect-error
store1.isBigger!.value();
// @ts-expect-error
store1.nested.$toString!.value();

// Signal assignments.
const store2 = deepSignal<{ a?: number }>({});
const a = signal(1);

// @ts-expect-error
store2.a = a;

store2.$a = a;
const s5: number = store2.a!;
const s6: Signal<number | undefined> = store2.$a;

// Shallow
const store3 = deepSignal({
	a: { b: 1 },
	c: shallow({ b: 2 }),
});

store3.a.$b;
// @ts-expect-error
store3.c.$b;

store3.a = { b: 1 };
// @ts-expect-error
store3.c = { b: 2 };
store3.c = shallow({ b: 2 });

type Store4 = {
	a: { b: number };
	c: Shallow<{ b: number }>;
	d: Shallow<{ b: number }>;
};

const store4 = deepSignal<Store4>({
	a: { b: 1 },
	c: shallow({ b: 2 }),
	// @ts-expect-error
	d: { b: 3 },
});

store4.a.$b;
// @ts-expect-error
store4.c.$b;

// Manual typings
type Store5 = {
	a: { b: number };
	c: { b: number };
};
const store5 = deepSignal<Store5>({
	a: { b: 1 },
	c: { b: 1 },
});

store5.a.b;
store5.a.$b;
store5.c.b;
store5.c.$b;
// @ts-expect-error
store5.d;
store5.c = { b: 2 };

type Store6 = {
	[key: string]: { b: number };
};

const store6 = deepSignal<Store6>({
	a: { b: 1 },
	c: { b: 1 },
});

store6.a.b;
store6.a.$b;
store6.c.b;
store6.c.$b;
store6.d = { b: 2 };
store6.d.$b;
