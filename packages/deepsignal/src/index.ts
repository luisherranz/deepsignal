import "@preact/signals";
import { useMemo } from "preact/hooks";
import { deepSignal, type DeepSignal } from "../core/src";

export const useDeepSignal = <T extends object>(obj: T): DeepSignal<T> => {
	return useMemo(() => deepSignal(obj), []);
};

export { deepSignal, type DeepSignal } from "../core/src";
