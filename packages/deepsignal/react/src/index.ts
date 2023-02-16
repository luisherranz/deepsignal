import "@preact/signals-react";
import { useMemo } from "react";
import { deepSignal, type DeepSignal } from "../../core/src";

export const useDeepSignal = <T extends object>(obj: T): DeepSignal<T> => {
	return useMemo(() => deepSignal(obj), []);
};

export * from "../../core/src";
