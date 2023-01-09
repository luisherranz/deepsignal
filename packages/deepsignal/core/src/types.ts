import { Signal } from "@preact/signals-core";

export type DeepSignalObject<T extends object> = {
	[P in keyof T & string as `$${P}`]?: Signal<T[P]>;
} & {
	[P in keyof T]: T[P] extends Array<unknown>
		? DeepSignalArray<T[P]>
		: T[P] extends object
		? DeepSignalObject<T[P]>
		: T[P];
};

// @ts-expect-error
interface MyArray<T> extends Array<T> {
	map: <U>(
		callbackfn: (
			value: DeepSignal<T>,
			index: number,
			array: DeepSignalArray<T[]>
		) => U,
		thisArg?: any
	) => U[];
	forEach: (
		callbackfn: (
			value: DeepSignal<T>,
			index: number,
			array: DeepSignalArray<T[]>
		) => void,
		thisArg?: any
	) => void;
	concat(...items: ConcatArray<T>[]): DeepSignalArray<T[]>;
	concat(...items: (T | ConcatArray<T>)[]): DeepSignalArray<T[]>;
	reverse(): DeepSignalArray<T[]>;
	shift(): DeepSignal<T> | undefined;
	slice(start?: number, end?: number): DeepSignalArray<T[]>;
	splice(start: number, deleteCount?: number): DeepSignalArray<T[]>;
	splice(
		start: number,
		deleteCount: number,
		...items: T[]
	): DeepSignalArray<T[]>;
	filter<S extends T>(
		predicate: (
			value: DeepSignal<T>,
			index: number,
			array: DeepSignalArray<T[]>
		) => value is DeepSignal<S>,
		thisArg?: any
	): DeepSignalArray<S[]>;
	filter(
		predicate: (
			value: DeepSignal<T>,
			index: number,
			array: DeepSignalArray<T[]>
		) => unknown,
		thisArg?: any
	): DeepSignalArray<T[]>;
	reduce(
		callbackfn: (
			previousValue: DeepSignal<T>,
			currentValue: DeepSignal<T>,
			currentIndex: number,
			array: DeepSignalArray<T[]>
		) => T
	): DeepSignal<T>;
	reduce(
		callbackfn: (
			previousValue: DeepSignal<T>,
			currentValue: DeepSignal<T>,
			currentIndex: number,
			array: DeepSignalArray<T[]>
		) => DeepSignal<T>,
		initialValue: T
	): DeepSignal<T>;
	reduce<U>(
		callbackfn: (
			previousValue: U,
			currentValue: DeepSignal<T>,
			currentIndex: number,
			array: DeepSignalArray<T[]>
		) => U,
		initialValue: U
	): U;
	reduceRight(
		callbackfn: (
			previousValue: DeepSignal<T>,
			currentValue: DeepSignal<T>,
			currentIndex: number,
			array: DeepSignalArray<T[]>
		) => T
	): DeepSignal<T>;
	reduceRight(
		callbackfn: (
			previousValue: DeepSignal<T>,
			currentValue: DeepSignal<T>,
			currentIndex: number,
			array: DeepSignalArray<T[]>
		) => DeepSignal<T>,
		initialValue: T
	): DeepSignal<T>;
	reduceRight<U>(
		callbackfn: (
			previousValue: U,
			currentValue: DeepSignal<T>,
			currentIndex: number,
			array: DeepSignalArray<T[]>
		) => U,
		initialValue: U
	): U;
}
type ArrayType<T> = T extends Array<infer I> ? I : T;
type DeepSignalArray<T> = MyArray<ArrayType<T>> & {
	[key: number]: DeepSignal<ArrayType<T>>;
	$?: { [key: number]: Signal<ArrayType<T>> };
	$length?: Signal<number>;
};

export type DeepSignal<T> = T extends Array<unknown>
	? DeepSignalArray<T>
	: T extends object
	? DeepSignalObject<T>
	: T;

export declare const useDeepSignal: <T extends object>(obj: T) => DeepSignal<T>;

export declare const deepSignal: <T extends object>(obj: T) => DeepSignal<T>;

type FilterSignals<K> = K extends `$${infer P}` ? never : K;
export type RevertDeepSignalObject<T> = Pick<T, FilterSignals<keyof T>>;
type RevertDeepSignalArray<T> = Omit<T, "$" | "$length">;

export type RevertDeepSignal<T> = T extends Array<unknown>
	? RevertDeepSignalArray<T>
	: T extends object
	? RevertDeepSignalObject<T>
	: T;

export declare const peek: <
	T extends DeepSignalObject<object>,
	K extends keyof RevertDeepSignalObject<T>
>(
	obj: T,
	key: K
) => RevertDeepSignal<RevertDeepSignalObject<T>[K]>;

export type WellKnownSymbols =
	| "asyncIterator"
	| "hasInstance"
	| "isConcatSpreadable"
	| "iterator"
	| "match"
	| "matchAll"
	| "replace"
	| "search"
	| "species"
	| "split"
	| "toPrimitive"
	| "toStringTag"
	| "unscopables";
