import "@preact/signals-react";
import { useMemo } from "react";
import { deepSignal, type DeepSignal } from "../../core/src";
import { useSignals } from "@preact/signals-react/runtime";

export const useDeepSignal = <T extends object>(obj: T): DeepSignal<T> => {
	useSignals();
	return useMemo(() => deepSignal(obj), []);
};

export * from "../../core/src";
