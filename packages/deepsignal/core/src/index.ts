import { computed, signal, Signal } from "@preact/signals-core";

const proxyToSignals = new WeakMap();
const objToProxy = new WeakMap();
const arrayToArrayOfSignals = new WeakMap();
const rg = /^\$\$?/;
let peeking = false;

export const deepSignal = <T extends object>(obj: T): DeepSignal<T> => {
	if (!shouldProxy(obj)) throw new Error("This object can't be observed.");
	if (!objToProxy.has(obj))
		objToProxy.set(obj, new Proxy(obj, objectHandlers) as DeepSignal<T>);
	return objToProxy.get(obj);
};

export const peek = <
	T extends DeepSignalObject<object>,
	K extends keyof RevertDeepSignalObject<T>
>(
	obj: T,
	key: K
): RevertDeepSignal<RevertDeepSignalObject<T>[K]> => {
	peeking = true;
	const value = obj[key];
	peeking = false;
	return value as RevertDeepSignal<RevertDeepSignalObject<T>[K]>;
};

const get =
	(isArrayOfSignals: boolean) =>
	(target: object, fullKey: string, receiver: object): unknown => {
		if (peeking) return Reflect.get(target, fullKey, receiver);
		let returnSignal = isArrayOfSignals || fullKey[0] === "$";
		if (!isArrayOfSignals && returnSignal && Array.isArray(target)) {
			if (fullKey === "$") {
				if (!arrayToArrayOfSignals.has(target))
					arrayToArrayOfSignals.set(target, new Proxy(target, arrayHandlers));
				return arrayToArrayOfSignals.get(target);
			}
			returnSignal = fullKey === "$length";
		}
		if (!proxyToSignals.has(receiver)) proxyToSignals.set(receiver, new Map());
		const signals = proxyToSignals.get(receiver);
		const key = returnSignal ? fullKey.replace(rg, "") : fullKey;
		if (
			!signals.has(key) &&
			typeof Object.getOwnPropertyDescriptor(target, key)?.get === "function"
		) {
			signals.set(
				key,
				computed(() => Reflect.get(target, key, receiver))
			);
		} else {
			let value = Reflect.get(target, key, receiver);
			if (typeof key === "symbol" && wellKnownSymbols.has(key)) return value;
			if (!signals.has(key)) {
				if (shouldProxy(value)) {
					if (!objToProxy.has(value))
						objToProxy.set(value, new Proxy(value, objectHandlers));
					value = objToProxy.get(value);
				}
				signals.set(key, signal(value));
			}
		}
		return returnSignal ? signals.get(key) : signals.get(key).value;
	};

const mutationError = "Don't mutate the signals directly.";

const objectHandlers = {
	get: get(false),
	set(target: object, key: string, val: any, receiver: object) {
		if (key[0] === "$") throw new Error(mutationError);
		let internal = val;
		if (shouldProxy(val)) {
			if (!objToProxy.has(val))
				objToProxy.set(val, new Proxy(val, objectHandlers));
			internal = objToProxy.get(val);
		}
		if (!proxyToSignals.has(receiver)) proxyToSignals.set(receiver, new Map());
		const signals = proxyToSignals.get(receiver);
		if (!signals.has(key)) signals.set(key, signal(internal));
		else signals.get(key).value = internal;
		const result = Reflect.set(target, key, val, receiver);
		if (Array.isArray(target) && signals.has("length"))
			signals.get("length").value = target.length;
		return result;
	},
};

const arrayHandlers = {
	get: get(true),
	set() {
		throw new Error(mutationError);
	},
};

const wellKnownSymbols = new Set(
	Object.getOwnPropertyNames(Symbol)
		.map(key => Symbol[key as WellKnownSymbols])
		.filter(value => typeof value === "symbol")
);
const supported = new Set([Object, Array]);
const shouldProxy = (val: any): boolean => {
	if (typeof val !== "object" || val === null) return false;
	const isBuiltIn =
		typeof val.constructor === "function" &&
		val.constructor.name in globalThis &&
		(globalThis as any)[val.constructor.name] === val.constructor;
	return !isBuiltIn || supported.has(val.constructor);
};

/***********/
/** Types **/
/***********/

type DeepSignalObject<T extends object> = {
	[P in keyof T & string as `$${P}`]?: Signal<T[P]>;
} & {
	[P in keyof T]: T[P] extends Array<unknown>
		? DeepSignalArray<T[P]>
		: T[P] extends object
		? DeepSignalObject<T[P]>
		: T[P];
};

// @ts-expect-error
interface DeepArray<T> extends Array<T> {
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
type DeepSignalArray<T> = DeepArray<ArrayType<T>> & {
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

type FilterSignals<K> = K extends `$${infer P}` ? never : K;
type RevertDeepSignalObject<T> = Pick<T, FilterSignals<keyof T>>;
type RevertDeepSignalArray<T> = Omit<T, "$" | "$length">;

type RevertDeepSignal<T> = T extends Array<unknown>
	? RevertDeepSignalArray<T>
	: T extends object
	? RevertDeepSignalObject<T>
	: T;

type WellKnownSymbols =
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
