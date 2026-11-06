class Model {
    constructor() {
        this.lookup = new Map();
        this.tokens = [];
        this.connections = new Map();
    }

    /**
     * Get the id of a token from the lookup table if it exists
     * @param {any} token 
     * @returns {integer}
     */

    id(token) {
        return this.lookup.get(token) ?? null;
    }

    /**
     * Predict the next token after a token
     * @param {integer} id - Token id to build upon
     * @param {integer} type - Method to generate the next tokens, 0-2, 0 for random, 1 for weighted random, 2 for top match
     * @returns {integer}
     */

    predict(id, type) {
        const connections = this.connections.get(id);

        // Type 0 returns a random key regardless of weight
        function weightless() {
            const keys = [...connections.keys()];
            const random = keys[Math.floor(Math.random() * keys.length)];
            return random;
        }

        function weighted() {
            const weights = [...connections.values()];
            const total = weights.reduce((total, current) => total + current, 0);
            let random = Math.floor(Math.random() * total);
            for (const [key, weight] of connections) {
                random -= weight;
                if (random < 0) {
                    return key;
                }
            }
        }

        function top() {
            let max = 0;
            let id = 0;
            for (const [key, weight] of connections) {
                if (max < weight) {
                    max = weight;
                    id = key;
                }
            }

            return id;
        }

        if (connections) {
            switch (type) {
                case 0:
                    // Type 0 returns a random key regardless of weight
                    return weightless();

                case 1:
                    // Type 1 returns a random key using the weights
                    return weighted();

                case 2:
                    // Type 2 returns the top key based on weight
                    return top();

                default:
                    throw new Error(`Unknown type: ${type}`);
            }
        } else {
            return null;
        }
    }

    /**
     * Given an array of token ids, return an array with mapped values
     * @param {array} tokens 
     * @returns {array}
     */

    untokenize(tokens) {
        if (!Array.isArray(tokens)) {
            throw new Error('Input is not an array');
        }

        let mapped = [];

        for (const token of tokens) {
            if (typeof token !== "number" || !Number.isInteger(token)) {
                throw new Error("Non-integer value met in array");
            }
            mapped.push(this.tokens[token]);
        }

        return mapped;
    }

    /**
     * Returns a model object built from serialized model JSON
     * @param {string} json 
     * @returns {Model}
     */

    static deserialize(json) {
        json = JSON.parse(json);

        if (!json.tokens || !json.connections) {
            throw new Error('Fatal error: Field(s) missing from JSON')
        };

        const model = new Model();

        model.tokens = json.tokens;

        for (let i = 0; i < model.tokens.length; i++) {
            model.lookup.set(model.tokens[i], i);
        }

        for (const values of json.connections) {
            const transitions = new Map();
            for (let i = 1; i < values.length; i += 2) {
                transitions.set(values[i], values[i + 1]);
            }
            model.connections.set(values[0], transitions);
        }

        return model;
    }
}

class ModelConstructor extends Model {
    constructor() {
        super();
    }

    /**
     * 
     * @param {string} value 
     * @returns {integer}
     */

    instantiate(value) {
        let id = this.lookup.get(value);

        if (id === undefined) {
            id = this.tokens.length;
            this.lookup.set(value, id);
            this.tokens.push(value);
        }

        return id;
    }

    /**
     * Builds a connection using the tokens previous and next
     * @param {any} previous 
     * @param {any} next 
     */

    connect(previous, next) {
        // Id of context token
        const context = this.instantiate(previous);
        // Id of following token
        const token = this.instantiate(next);

        let connection = this.connections.get(context);

        if (!connection) {
            connection = new Map();
            this.connections.set(context, connection);
        }

        connection.set(token, (connection.get(token) ?? 0) + 1);
    }

    /**
     * Updates the model with connections from the array using the recall as context
     * @param {array} array 
     * @param {integer} recall 
     */

    build(array, recall) {
        const layer = Math.min(array.length - 1, recall);
        const tokens = array.length - layer;
        if (layer > 0) {
            for (let i = 0; i < tokens; i++) {
                let context = array.slice(i, i + layer).join('');
                let token = array[i + layer];
                this.connect(context, token);
            }
        }
    }

    /**
     * Build model from all context values in the range 1 to max
     * @param {array} array 
     * @param {integer} max 
     * @param {integer} owner 
     */

    assemble(array, max) {
        const context = Math.min(array.length - 1, max);

        if (context > 0) {
            for (let i = 1; i <= max; i++) {
                this.build(array, i);
            }
        }
    }

    /**
     * Serializes the model into stringified JSON
     * @returns {string}
     */

    serialize() {
        let model = { version: 1.0, tokens: this.tokens, connections: [] };
        for (const [key, value] of this.connections) {
            let transitions = [key];
            for (const [token, count] of value) {
                transitions.push(...[token, count]);
            }
            model.connections.push(transitions);
        }

        return JSON.stringify(model);
    }
}

export { Model, ModelConstructor };
