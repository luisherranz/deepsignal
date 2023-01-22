import { signal } from "@preact/signals-react";
import { useMemo } from "react";
import { deepSignal, type DeepSignal } from "../../core/src";

export const useDeepSignal = <T extends object>(obj: T): DeepSignal<T> => {
	signal(0);
	return useMemo(() => deepSignal(obj), []);
};

export * from "../../core/src";
