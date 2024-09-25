document.getElementById('fillForm').addEventListener('click', async () => {
  const prompt = document.getElementById('prompt').value;
  console.log('Prompt entered:', prompt);
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log('Current tab:', tab.id);
  
  try {
    // Send message to content script to capture screenshot and HTML
    await chrome.tabs.sendMessage(tab.id, { action: "captureAndFill", prompt: prompt });
    console.log('Message sent to content script');

    // Wait for AI processing and code execution
    const result = await new Promise((resolve) => {
      chrome.runtime.onMessage.addListener(function listener(message) {
        if (message.action === "aiProcessingComplete") {
          chrome.runtime.onMessage.removeListener(listener);
          resolve(message.result);
        }
      });
    });

    console.log('AI processing result:', result);
    // You can add code here to show the result to the user if needed
  } catch (error) {
    console.error('Error during form filling:', error);
    // You can add code here to show an error message to the user
  }
});
