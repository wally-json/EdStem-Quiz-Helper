const CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';

async function askClaude(question, choices) {
    const result = await chrome.storage.sync.get(['apiKey']);
    const apiKey = result.apiKey;
    
    if (!apiKey) {
        throw new Error('Please set your Claude API key in the extension options');
    }

    const prompt = `Please analyze this question and explain each option separately:

Question: ${question}

Options:
${choices.map((choice, i) => `${i + 1}. ${choice}`).join('\n')}

Please format your response like this:
Option 1: [Detailed explanation of the option's validity]
Option 2: [Detailed explanation of the option's validity]
...etc.

Make each explanation clear, concise, and avoid telling the student what is the correct answer.`;
    console.log(prompt);
    try {
        const response = await fetch(CLAUDE_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                system: "You are a helpful AI assistant that helps students understand and solve quiz questions. Please provide clear explanations and reasoning for your answers."
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response:', errorText);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        return { answer: data.content[0].text };
    } catch (error) {
        console.error('Claude API error:', error);
        throw error;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "askClaude") {
        askClaude(request.data.question, request.data.choices)
            .then(response => sendResponse(response))
            .catch(error => sendResponse({ error: error.message }));
        return true; // 表示我們會異步發送回應
    }
}); 