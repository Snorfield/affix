# Affix
Affix is a work-in-progress light-weight and fast markov model library for JavaScript

# Documentation

It is important to note the difference between the two classes, `Model`, and `ModelConstructor`. `Model` is meant to be a light-weight class with no training methods, it's strictly used to generate an output. `ModelConstructor` is used to actually update and train a model instance. Let's begin by creating a constructor.

```js
const model = new ModelConstructor();
```

First of all, we need to give it some content. You'll need an array of tokens, this can be integers, strings, etc. It can't be objects or arrays since JavaScript only compares references, not values. You can potentially implement this if you need it by using integers refer to the index of your objects or arrays in another array.

```js
// Assuming 'tokens' is an array of tokens
// Assuming context is an integer defining how many previous tokens to use for context
model.update(tokens, context);
```

Under the hood, Affix has now connected the tokens in an optimized fashion. `model.update()` can be called as many times as needed.

We need ids to actually predict something from our data.

```js
// Assuming 'value' is some value that you want to find the interal id for
const id = model.id(value);
```

Now that we have an id, affix can predict something. Affix allows several internal modes of prediction:

- `0` corresponds to fully random prediction. Affix ignores all weights.
- `1` corresponds to weighted random prediction. Higher weights equals higher chance of that token being selected
- `2` corresponds to the top match. affix will return the token with the highest weight

```js
// Assuming 'id' is the id of the token we want to predict after
// Assuming 'type' is the integer setting for the prediction mode
const predicted_id = model.predict(id, type);
```
This id is however, not human-readable. We can fix that with the next method.

```js
// Assume 'ids' is an array of internal token ids
// Returns another array with the mapped values
const tokens = model.detokenize(ids);
```

We also want to store and load our models for future use.

```js
// node:fs is used here to demonstrate
fs.writeFileSync('./model.mrkv', model.serialize(), 'utf-8');

const model = Model.deserialize(fs.readFileSync('./model.mrkv', 'utf-8'));
// ModelConstructor.deserialize() if you need to update the model
```

Worth noting other internal values you can access.

```js
model.tokens // Array of all original token values
model.lookup // Map for token value to internal id
model.connections // Map of maps for connections
```
