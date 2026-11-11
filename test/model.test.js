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