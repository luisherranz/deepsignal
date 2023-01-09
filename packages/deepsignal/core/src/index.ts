import { computed, signal } from "@preact/signals-core";
import type {
	DeepSignal,
	DeepSignalObject,
	RevertDeepSignalObject,
	RevertDeepSignal,
	WellKnownSymbols,
} from "./types";
export type { DeepSignal } from "./types";

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
