# deepsignal

`deepsignal` is a npm package that allows you to use Preact signals in a plain JavaScript object that can be mutated.

It works by wrapping the object with a `Proxy`, which intercepts all property accesses and returns the signal value by default. This allows you to easily create a deep object that can be observed for changes, while still being able to mutate the object normally. Nested objects and arrays are also converted to deep signal objects/arrays, allowing you to create a fully reactive data structure. Prefixes can be used to return the signal instance (`state.$prop`) or to peek (`state.$$prop`).

- [Installation](#installation)
- [API](#guide)
  - [`signal(initialValue)`](#signalinitialvalue)
    - [`signal.peek()`](#signalpeek)
  - [`computed(fn)`](#computedfn)
  - [`effect(fn)`](#effectfn)
  - [`batch(fn)`](#batchfn)
- [Preact Integration](./packages/preact/README.md#preact-integration)
  - [Hooks](./packages/preact/README.md#hooks)
  - [Rendering optimizations](./packages/preact/README.md#rendering-optimizations)
    - [Attribute optimization (experimental)](./packages/preact/README.md#attribute-optimization-experimental)
- [React Integration](./packages/react/README.md#react-integration)
  - [Hooks](./packages/react/README.md#hooks)
- [License](#license)

## Features

- **Transparent**: `deepsignal` wraps the objects with proxies, which intercepts all property accesses, but does not modify the object. This means that you can still use the object as you normally would, and it will behave exactly as expected. Mutating the object updates the value of the underlying signals.
- **Tiny (less than 1Kb)**: `deepsignal` is designed to be lightweight and has a minimal footprint, making it easy to include in your projects. It's just a wrapper around `@preact/signals-core`.
- **TypeScript support**: `deepsignal` is written in TypeScript and includes type definitions, so you can use it seamlessly with your TypeScript projects, including access to the signal and peek through the prefixes `state.$prop` and `state.$$prop`.
- **Full array support**: `deepsignal` fully supports arrays, including nested arrays. You can use `state.$[index]` prefix to get a signal for an array element, or the `state.$$[index]` prefix to peek the current value.
- **Deep**: `deepsignal` converts nested objects and arrays to deep signal objects/arrays, allowing you to create fully reactive data structures.
- **Lazy initialization**: `deepsignal` uses lazy initialization, which means that signals are only created when they are accessed for the first time. This can help improve performance in cases where you only need to observe a small subset of the object's properties.
- **Stable references**: `deepsignal` uses stable references, which means that the same `Proxy` instances will be returned for the same objects so they can exist in different places of the data structure, just like regular JavaScript objects.
- **Automatic derived state**:

## Installation:

```sh
npm install deepsignal
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

// Read value from signal, logs: 0.
console.log(state.counter);

// Mutates the underlying signal.
state.counter = 1;
```

Writing to a signal is done by mutating the object's properties. Changing a signal's value will synchronously update every `computed` and `effect` that depends on that signal, ensuring your app state is always consistent.

```js
const state = deepSignal({ counter: 0 });

// Runs the first time, reads value from signal, logs: 0.
effect(() => {
	console.log(state.counter);
});

// Mutates the underlying signal. The effect runs again, logs: 1.
state.counter = 1;
```

## When do you need access to signals?

Chances are you will rarely need access to the underlying signals except for some performance optimizations.

### Passing the value of a signal directly to JSX

This works fine but `Component` renders each time `state.counter` changes.

```js
const state = deepSignal({ counter: 0 });

// Reads value from signal, outputs: <div>0</div>
const Component = () => <div>{state.counter}</div>;

// Mutates the underlying signal. The component is rerender again and outputs: <div>1</div>
state.counter = 1;
```

We can pass the signal directly to JSX to mutate the DOM directly and bypass the `Component` rerenders:

```js
const state = deepSignal({ counter: 0 });

// Reads value from signal, outputs: <div>0</div>
const Component = () => <div>{state.$counter}</div>;

// Mutates the underlying signal. The DOM is mutated to: <div>1</div>
state.counter = 1;
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

## Peek the underlying JavaScript object with $$

Chances are you will rarely need access to the underlying JavaScript object except when you have an effect that should write to another signal based on the previous value, but you _don't_ want the effect to be subscribed to that signal.

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

### `computed(fn)`

Data is often derived from other pieces of existing data. The `computed` function lets you combine the values of multiple signals into a new signal that can be reacted to, or even used by additional computeds. When the signals accessed from within a computed callback change, the computed callback is re-executed and its new return value becomes the computed signal's value.

```js
import { signal, computed } from "@preact/signals-core";

const name = signal("Jane");
const surname = signal("Doe");

const fullName = computed(() => name.value + " " + surname.value);

// Logs: "Jane Doe"
console.log(fullName.value);

// Updates flow through computed, but only if someone
// subscribes to it. More on that later.
name.value = "John";
// Logs: "John Doe"
console.log(fullName.value);
```

Any signal that is accessed inside the `computed`'s callback function will be automatically subscribed to and tracked as a dependency of the computed signal.

### `effect(fn)`

The `effect` function is the last piece that makes everything reactive. When you access a signal inside its callback function, that signal and every dependency of said signal will be activated and subscribed to. In that regard it is very similar to [`computed(fn)`](#computedfn). By default all updates are lazy, so nothing will update until you access a signal inside `effect`.

```js
import { signal, computed, effect } from "@preact/signals-core";

const name = signal("Jane");
const surname = signal("Doe");
const fullName = computed(() => name.value + " " + surname.value);

// Logs: "Jane Doe"
effect(() => console.log(fullName.value));

// Updating one of its dependencies will automatically trigger
// the effect above, and will print "John Doe" to the console.
name.value = "John";
```

You can destroy an effect and unsubscribe from all signals it was subscribed to, by calling the returned function.

```js
import { signal, computed, effect } from "@preact/signals-core";

const name = signal("Jane");
const surname = signal("Doe");
const fullName = computed(() => name.value + " " + surname.value);

// Logs: "Jane Doe"
const dispose = effect(() => console.log(fullName.value));

// Destroy effect and subscriptions
dispose();

// Update does nothing, because no one is subscribed anymore.
// Even the computed `fullName` signal won't change, because it knows
// that no one listens to it.
surname.value = "Doe 2";
```

### `batch(fn)`

The `batch` function allows you to combine multiple signal writes into one single update that is triggered at the end when the callback completes.

```js
import { signal, computed, effect, batch } from "@preact/signals-core";

const name = signal("Jane");
const surname = signal("Doe");
const fullName = computed(() => name.value + " " + surname.value);

// Logs: "Jane Doe"
effect(() => console.log(fullName.value));

// Combines both signal writes into one update. Once the callback
// returns the `effect` will trigger and we'll log "Foo Bar"
batch(() => {
	name.value = "Foo";
	surname.value = "Bar";
});
```

When you access a signal that you wrote to earlier inside the callback, or access a computed signal that was invalidated by another signal, we'll only update the necessary dependencies to get the current value for the signal you read from. All other invalidated signals will update at the end of the callback function.

```js
import { signal, computed, effect, batch } from "@preact/signals-core";

const counter = signal(0);
const double = computed(() => counter.value * 2);
const triple = computed(() => counter.value * 3);

effect(() => console.log(double.value, triple.value));

batch(() => {
	counter.value = 1;
	// Logs: 2, despite being inside batch, but `triple`
	// will only update once the callback is complete
	console.log(double.value);
});
// Now we reached the end of the batch and call the effect
```

Batches can be nested and updates will be flushed when the outermost batch call completes.

```js
import { signal, computed, effect, batch } from "@preact/signals-core";

const counter = signal(0);
effect(() => console.log(counter.value));

batch(() => {
	batch(() => {
		// Signal is invalidated, but update is not flushed because
		// we're still inside another batch
		counter.value = 1;
	});

	// Still not updated...
});
// Now the callback completed and we'll trigger the effect.
```

## License

`MIT`, see the [LICENSE](./LICENSE) file.

## Inspirations

@nx-js/observer-util
