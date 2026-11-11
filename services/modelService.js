const TIMEOUT_MS = 5000;

class ModelService {
    static async generateStudyPlan(topicDescription) {
        const apiKey = process.env.OPENAI_API_KEY;

        // Fallback if the API key is missing
        if (!apiKey) {
            return {
                fallback: true,
                message: "AI study plan generator is currently unavailable. Please create a manual plan.",
                plan: []
            };
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: `Generate a 3-week study plan for: ${topicDescription}` }]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return {
                fallback: false,
                plan: data.choices[0].message.content
            };
        } catch (error) {
            // Deterministic fallback on timeout, network error, or rate limit
            return {
                fallback: true,
                message: "AI study plan generator is currently unavailable. Please create a manual plan.",
                plan: []
            };
        }
    }
}

module.exports = ModelService;