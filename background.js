chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background script:', request);
  if (request.action === "captureVisibleTab") {
    console.log('Capturing visible tab');
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      console.log('Screenshot captured, data URL length:', dataUrl.length);
      sendResponse({ imageDataUrl: dataUrl });
    });
    return true; // Indicates that the response is asynchronous
  } else if (request.action === "processAI") {
    console.log('Processing with AI');
    processWithAI(request.prompt, request.html, request.screenshot)
      .then(async instructions => {
        console.log('AI processing complete, instructions:', instructions);
        const result = await executeAIInstructions(sender.tab.id, instructions);
        chrome.runtime.sendMessage({ action: "aiProcessingComplete", result: result });
      })
      .catch(error => {
        console.error("AI processing error:", error);
        chrome.runtime.sendMessage({ action: "aiProcessingComplete", result: { error: error.message } });
      });
  }
});

async function processWithAI(prompt, html, screenshot) {
  console.log('Setting up AI processing');
  const apiKey = 'ENTER_API_KEY_HERE';
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  const messages = [
    { role: "system", content: "You are an AI assistant that generates instructions to fill forms on web pages based on HTML content, a screenshot, and a user prompt. Return a JSON array of instructions, where each instruction is an object with 'action', 'selector', and 'value' properties. Supported actions are 'setValue' and 'click'." },
    { role: "user", content: `Prompt: ${prompt}\n\nHTML: ${html}\n\nScreenshot: ${screenshot}

Please generate a JSON object containing instructions for automating interactions on a web page. The JSON should have the following structure:

{
  "actions": [ /* array of action objects */ ]
}

Instruction Types and Parameters:

	1.	Click Action

	•	Type: "click"
	•	Required Fields:
	•	"method": "selector", "xpath", "coordinates", or "text"
	•	Depending on "method":
	•	"selector": CSS selector string
	•	"expression": XPath expression string
	•	"coordinates": Object with "x" and "y" numbers
	•	"text": Text string to match

	2.	Type Action

	•	Type: "type"
	•	Required Fields:
	•	"method": "selector" or "xpath"
	•	"selector" or "expression": Depending on the method
	•	"value": String to input

	3.	Wait Action

	•	Type: "wait"
	•	Required Fields:
	•	Either "duration": Number of milliseconds to wait
	•	Or "condition": Object with:
	•	"type": "elementVisible", "elementNotVisible", etc.
	•	"method": "selector" or "xpath"
	•	"selector" or "expression": Depending on the method
	•	"timeout": (Optional) Max milliseconds to wait

	4.	Scroll Action

	•	Type: "scroll"
	•	Required Fields:
	•	"position": Object with "x" and "y" numbers

	5.	Evaluate Action

	•	Type: "evaluate"
	•	Required Fields:
	•	"scriptId": Identifier string for the predefined script

Example click action:
{
  "type": "click",
  "method": "selector",
  "selector": "#loginButton"
}

Example type action:
{
  "type": "type",
  "method": "selector",
  "selector": "input[name=\"username\"]",
  "value": "john_doe"
}

  Instructions:

	•	The output should be a valid JSON object matching the specified structure.
	•	Use only the defined action types and methods.
	•	Do not include any additional text, explanations, or comments.
	•	Ensure all strings are properly escaped.
	•	The JSON should be syntactically correct.` }
  ];

  console.log('Sending request to OpenAI API');
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 500
    })
  });

  console.log('Received response from OpenAI API');
  const data = await response.json();
  console.log('API response:', data);

  const content = data.choices[0].message.content;
  const contentWithoutJsonBlock = content.replace(/```json([\s\S]*?)```/g, '$1').trim();
  const instructions = JSON.parse(contentWithoutJsonBlock);
  console.log('Generated instructions:', instructions);
  return instructions.actions;
}

// Function to execute AI-generated instructions
async function executeAIInstructions(tabId, instructions) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.tabs.sendMessage(tabId, { action: "executeInstructions", instructions: instructions });
        return result;
    } catch (error) {
        console.error("Error executing AI instructions:", error);
        return { error: error.message };
    }
}
