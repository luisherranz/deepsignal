# DeepSignal

`deepsignal` is a package that allows you to use Preact signals in a plain JavaScript object that can be mutated.

It works by wrapping the object with a `Proxy` that intercepts all property accesses and returns the signal value by default. This allows you to easily create a deep object that can be observed for changes, while still being able to mutate the object normally. Nested objects and arrays are also converted to deep signal objects/arrays, allowing you to create a fully reactive data structure. Prefixes can be used to return the signal instance (`state.$prop`) or to peek the value (`state.$$prop`).

- [DeepSignal](#deepsignal)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
  - [API](#api)
    - [`deepSignal`](#-deepsignal-)
    - [`get prop() { ... }`](#-get-prop--------)
    - [`state.$prop`](#-state-prop-)
    - [`array.$[index]`](#-array--index--)
    - [`array.$length`](#-array-length-)
    - [`state.$$prop`, `array.$$[index]` and `array.$$length`](#-state--prop----array---index---and--array--length-)
    - [`useDeepSignal`](#usedeepsignal)
  - [When do you need access to signals?](#when-do-you-need-access-to-signals-)
    - [Passing the value of a signal directly to JSX](#passing-the-value-of-a-signal-directly-to-jsx)
    - [Passing a signal to a child component](#passing-a-signal-to-a-child-component)
  - [TypeScript](#typescript)
  - [License](#license)

## Features

- **Transparent**: `deepsignal` wraps the objects with proxies that intercept all property accesses, but does not modify the object. This means that you can still use the object as you normally would, and it will behave exactly as expected. Mutating the object updates the value of the underlying signals.
- **Tiny (less than 1Kb)**: `deepsignal` is designed to be lightweight and has a minimal footprint, making it easy to include in your projects. It's just a small wrapper around `@preact/signals-core`.
- **Full array support**: `deepsignal` fully supports arrays, including nested arrays.
- **Deep**: `deepsignal` converts nested objects and arrays to deep signal objects/arrays, allowing you to create fully reactive data structures.
- **Lazy initialization**: `deepsignal` uses lazy initialization, which means that signals and proxies are only created when they are accessed for the first time. This reduces the initialization time to almost zero and improves the overall performance in cases where you only need to observe a small subset of the object's properties.
- **Stable references**: `deepsignal` uses stable references, which means that the same `Proxy` instances will be returned for the same objects so they can exist in different places of the data structure, just like regular JavaScript objects.
- **Automatic derived state**: getters are automatically converted to computeds instead of signals.
- **TypeScript support**: `deepsignal` is written in TypeScript and includes type definitions, so you can use it seamlessly with your TypeScript projects, including access to the signal and the peek value through the prefixes `state.$prop` and `state.$$prop`.

The most important feature is that **it just works**. You don't need to do anything special. Just create an object, mutate it normally and all your components will know when they need to rerender.

## Installation

```sh
npm install deepsignal
```

If you are using `deepsignal` with Preact (`@preact/signals`), you should use the `deepsignal` import. You don't need to install or import `@preact/signals` anywhere in your code if you don't need it.

```js
import { deepSignal } from "deepsignal";

const state = deepSignal({});
```

If you are using the library with `@preact/signals-core`, you should use the `deepsignal/core` import.

```js
import { deepSignal } from "deepsignal/core";

const state = deepSignal({});
```

This is because the `deepsignal` import includes a dependency on `@preact/signals`, while the `deepsignal/core` import does not. This allows you to use deep signals with either `@preact/signals` or `@preact/signals-core`, depending on your needs. **Do not use both.**

_There's no support for `@preact/signals-react` yet but if you need it, please open an issue._

## Usage

The usage is similar to Preact's `signal`, but it works with objects and arrays and the access to the value and signal is reversed. By default, the object returns the value and not the signal:

- Use `state.prop` to access the value (you don't need to use `state.prop.value`).
- Use `state.prop` to mutate the value (you don't need to use `state.prop.value`).
- Use `state.$prop` to access the signal instance (only needed for performance optimizations).

This Preact's signals example:

```js
import { signal, computed } from "@preact/signals";

const count = signal(0);
const double = computed(() => count.value * 2);

function Counter() {
	return (
		<button onClick={() => (count.value += 1)}>
			{count} x 2 = {double}
		</button>
	);
}
```

becomes like this with `deepsignal`:

```js
import { deepSignal } from "deepsignal";

const state = deepSignal({
	count: 0,
	get double() {
		return state.count * 2;
	},
});

function Counter() {
	return (
		<button onClick={() => (state.count += 1)}>
			{state.$count} x 2 = {state.$double}
		</button>
	);
}
```

## API

### `deepSignal`

```ts
deepSignal<T extends object>(obj: T): DeepSignal<T>;
```

The `deepSignal` function creates a new deep signal. You can read or mutate the underlying signal values by accessing the object's properties just like you would in a regular JavaScript object.

```js
import { deepSignal } from "deepsignal";

const state = deepSignal({ counter: 0 });

// Reads the value, logs: 0.
console.log(state.counter);

// Mutates the underlying signal.
state.counter = 1;

// Reads the value, logs: 1.
console.log(state.counter);
```

Writing to a signal is done by mutating the object's properties. Changing a property's value will synchronously update every component and `effect` that depends on its signal, ensuring your app state is always consistent.

```js
const state = deepSignal({ counter: 0 });

// Runs the first time, reads the value and outputs: <div>0</div>
const Counter = () => <div>{state.counter}</div>;

// Runs the first time, reads the value and logs: 0.
effect(() => {
	console.log(state.counter);
});

// Mutates the underlying signal.
state.counter = 1;
// The effect runs again, logs: 1.
// The component renders again, outputs: <div>1</div>.
```

### `get prop() { ... }`

Using JavaScript getters with `deepsignal` allows you to define computed properties that are based on the values of other properties, and ensures that the computed properties are automatically updated whenever the values of the other properties change. `deepsignal` will convert getters to `computed` values instead of `signal` instances underneath.

```js
const state = deepSignal({
	counter: 1,
	get double() {
		return state.counter * 2;
	},
});

// Runs the first time, reads value from the getter, logs: 2.
effect(() => {
	console.log(state.double);
});

// Mutates the dependency. The effect runs again, logs: 4.
state.counter = 2;
```

### `state.$prop`

You can access the underlying signal of an object's property by using the `$` prefix, like so: `state.$prop`.

```js
const state = deepSignal({ counter: 0 });

// Runs the first time, read value from signal, logs: 0.
state.$counter.subscribe(console.log);

// Mutates the underlying signal. The subscription runs again, logs: 1.
state.counter = 1;
```

### `array.$[index]`

You can access the underlying signal of an array's item by using the `$` prefix, like so: `state.$[index]`.

```js
const array = deepSignal([0]);

// Runs the first time, read value from signal, logs: 0.
array.$[0].subscribe(console.log);

// Mutates the underlying signal. The subscription runs again, logs: 1.
array[0] = 1;
```

_Please note that although the syntax is similar, there's a difference between objects and arrays. In objects, each prop has a signal counterpart (`state.prop` -> `state.$prop`) whereas in arrays, the `array.$` prop returns a new array of signals, therefore the difference between `array[index]` and `array.$[index]`._

### `array.$length`

Arrays can access the length signal with a property called `array.$length` in the same way that objects have access to `state.$prop`.

```js
const array = deepSignal([0]);

// Runs the first time, logs: 1.
array.$length.subscribe(console.log);

// Mutates the array. The subscription runs again, logs: 2.
array.push(1);
```

### `state.$$prop`, `array.$$[index]` and `array.$$length`

Chances are you will rarely need access to the underlying JavaScript object except when you have an effect that should write to another signal based on the previous value, but you _don't_ want the effect to be subscribed to that signal. You can use `state.$$prop` to peek the value of a signal:

```js
const state = deepSignal({ value: 0, effectCount: 0 });

effect(() => {
	console.log(state.value);

	// Whenever this effect is triggered, increase `effectCount`, but we don't
	// want this effect to react to `effectCount`.
	state.effectCount = state.$$effectCount + 1;
});
```

Note that you should only use `state.$$prop` if you really need it. Reading a signal's value via `state.prop` is the preferred way in most scenarios.

The `$$` prefixes follow the same rules as the `$` ones:

- Peek an object property with `state.$$prop`.
- Peek an array item with `array.$$[index]`.
- Peek an array length with `array.$$length`.

For primitive values, you can get away using `store.$prop.peek()` instead of `state.$$prop`. But in `deepsignal`, the underlying signals store the proxies, not the object. That means it's not safe to use `state.$prop.peek()` if `prop` is an object. You should use `state.$$prop` instead, which returns the original object.

### `useDeepSignal`

_Only available on `deepsignal`, not on `deepsignal/core`._

If you need to create a reference stable version of a deep signal that is hooked to a component instance you can use the `useDeepSignal` hook:

```js
import { useDeepSignal } from "deepsignal";

function Counter() {
	const state = useDeepSignal({
		counter: 0,
		get double() {
			return state.counter * 2;
		},
	});

	return (
		<button onClick={() => (state.count += 1)}>
			Value: {state.$counter}, value x 2 = {state.$double}
		</button>
	);
}
```

## When do you need access to signals?

You will only need access to the underlying signals for performance optimizations.

### Passing the value of a signal directly to JSX

This works fine but `Component` will render each time `state.counter` changes.

```js
const state = deepSignal({ counter: 0 });

// Reads value from signal, outputs: <div>0</div>
const Component = () => <div>{state.counter}</div>;

// Mutates the underlying signal. The component is rerender again and outputs: <div>1</div>
state.counter = 1;
```

We can pass the signal directly to JSX and Preact will mutate the DOM instead of rerendering `Component`:

```js
const state = deepSignal({ counter: 0 });

// Reads value from signal, outputs: <div>0</div>
const Component = () => <div>{state.$counter}</div>;

// Mutates the underlying signal. The DOM is mutated to: <div>1</div>
state.counter = 1;
```

### Passing a signal to a child component

This also works fine, but `Parent` will render each time `state.counter` changes.

```js
const state = deepSignal({ counter: 0 });

const Child = ({ counter }) => <span>{counter}</div>;
const Parent = () => <Child counter={state.counter} />;

// Mutates the underlying signal. Parent is rerender again.
state.counter = 1;
```

You can pass the signal directly to the child:

```js
const state = deepSignal({ counter: 0 });

const Child = ({ counter }) => <span>{counter}</div>;
const Parent = () => <Child counter={state.$counter} />;

// Mutates the underlying signal. Parent is not rerender.
state.counter = 1;
```

Be aware that if you do so, `counter` will become a regular Preact signal. If you need to access or mutate its value inside `Child`, you'd need to use `counter.value`.

## TypeScript

`deepsignal` has TypeScript support, which means that you can use it seamlessly with your TypeScript projects. `deepsignal` includes type definitions that provide type safety when working with deep signal objects, which can help you avoid common type-related mistakes and improve the overall quality of your code.

There is one caveat to consider when using `deepsignal` with TypeScript: you need to use the non-null assertion operator when accessing signals. This is because mutations don't work unless the signals are optional, so TypeScript does not know that the signal instance will always be defined and it will treat it as a possibly-undefined value. To fix this, you can use the non-null assertion operator (`!`) to tell TypeScript that the signal instance is definitely defined.

For example, consider the following code:

```js
const state = deepSignal({
  counter: 1
});

console.log(state.$counter.value); // error: Object is possibly 'undefined'.
console.log(state.$counter!.value); // 1
```

If we try to access the `value` property of the `$counter` signal, TypeScript will error because it does not know that the `$counter` signal is defined.

The same happens with arrays:

```js
const array = deepSignal([1]);

console.log(array.$[0].value); // error: Object is possibly 'undefined'.
console.log(array.$![0].value); // 1
```

Note that here the position of the non-null assertion operator changes because `array.$` is an object in itself.

## License

`MIT`, see the [LICENSE](./LICENSE) file.

---

_This library is hugely inspired by the work of [@solkimicreb](https://github.com/solkimicreb) with proxies and lazy initialization on [`@nx-js/observer-util`](https://github.com/nx-js/observer-util)._
