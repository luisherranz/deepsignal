import { Signal } from "@preact/signals-core";
import { deepSignal, peek } from "../src";

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
const store = deepSignal({
	value: 1,
	isBigger: (newValue: number): boolean => store.value > newValue,
	sum(newValue: number): number {
		return store.value + newValue;
	},
	valueSignal: (): Signal<number> => store.$value!,
	nested: {
		toString: (): string => `${store.value}`,
	},
});
const s1: boolean = store.isBigger(2);
const s2: number = store.sum(2);
const s3: Signal<number> = store.valueSignal();
const s4: string = store.toString();
// @ts-expect-error
store.isBigger!.value();
// @ts-expect-error
store.nested.$toString!.value();
