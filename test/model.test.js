const test = require('node:test');
const assert = require('node:assert');
const ModelService = require('../services/modelService');

test('Model Service fallback when API key is missing', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await ModelService.generateStudyPlan('Node.js');
    assert.strictEqual(result.fallback, true);
    assert.strictEqual(typeof result.message, 'string');

    process.env.OPENAI_API_KEY = originalKey;
});

test('Model Service success with API key and mock fetch', async () => {
    process.env.OPENAI_API_KEY = 'test-fake-key';
    const originalFetch = global.fetch;

    global.fetch = async () => ({
        ok: true,
        json: async () => ({
            choices: [{ message: { content: '1. Week one\n2. Week two\n3. Week three' } }]
        })
    });

    try {
        const result = await ModelService.generateStudyPlan('Node.js');
        assert.strictEqual(result.fallback, false);
        assert.ok(result.plan.includes('Week one'));
    } finally {
        global.fetch = originalFetch;
        delete process.env.OPENAI_API_KEY;
    }
});

test('Model Service handles fetch error gracefully', async () => {
    process.env.OPENAI_API_KEY = 'test-fake-key';
    const originalFetch = global.fetch;

    global.fetch = async () => ({
        ok: false,
        status: 500
    });

    try {
        const result = await ModelService.generateStudyPlan('Node.js');
        assert.strictEqual(result.fallback, true);
    } finally {
        global.fetch = originalFetch;
        delete process.env.OPENAI_API_KEY;
    }
});
test('Model Service handles timeout and returns fallback', async () => {
    process.env.OPENAI_API_KEY = 'test-fake-key';
    const originalFetch = global.fetch;

    global.fetch = async (_, options) => {
        return new Promise((resolve, reject) => {
            if (options && options.signal) {
                options.signal.addEventListener('abort', () => {
                    const err = new Error('The operation was aborted');
                    err.name = 'AbortError';
                    reject(err);
                });
            }
            setTimeout(resolve, 100);
        });
    };

    try {
        const result = await ModelService.generateStudyPlan('Node.js', 10);
        assert.strictEqual(result.fallback, true);
    } finally {
        global.fetch = originalFetch;
        delete process.env.OPENAI_API_KEY;
    }
});