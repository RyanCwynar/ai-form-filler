/* Start of Selection */
// Function to execute AI-generated instructions
// Content script

async function executeActions(actions) {
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'click':
          await handleClick(action);
          break;
        case 'type':
          await handleType(action);
          break;
        case 'wait':
          await handleWait(action);
          break;
        case 'evaluate':
          await handleEvaluate(action);
          break;
        case 'scroll':
          await handleScroll(action);
          break;
        // Add more cases as needed
        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      // Handle error based on your error handling strategy
    }
  }
}

// Action handlers
async function handleClick(action) {
  const element = await locateElement(action);
  if (element) {
    element.click();
  } else {
    throw new Error('Element not found for click action');
  }
}

async function handleType(action) {
  const element = await locateElement(action);
  if (element) {
    element.focus();
    element.value = action.text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    throw new Error('Element not found for type action');
  }
}

async function handleWait(action) {
  if (action.duration) {
    await new Promise(resolve => setTimeout(resolve, action.duration));
  } else if (action.condition) {
    await waitForCondition(action.condition, action.timeout);
  }
}

async function handleEvaluate(action) {
  const result = await predefinedEvaluations(action.scriptId);
  // Handle the result as needed
}

async function handleScroll(action) {
  window.scrollTo(action.position.x, action.position.y);
}

// Element locator
async function locateElement(action) {
  switch (action.method) {
    case 'selector':
      return document.querySelector(action.selector);
    case 'xpath':
      return document.evaluate(
        action.expression,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
    case 'coordinates':
      return document.elementFromPoint(action.x, action.y);
    case 'text':
      return Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent.includes(action.text));
    default:
      throw new Error(`Unknown element location method: ${action.method}`);
  }
}

// Condition evaluator
async function waitForCondition(condition, timeout = 5000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      let conditionMet = false;
      switch (condition.type) {
        case 'elementVisible':
          const element = locateElement(condition);
          conditionMet = element && element.offsetParent !== null;
          break;
        // Add more condition types as needed
        default:
          console.warn(`Unknown condition type: ${condition.type}`);
      }
      if (conditionMet) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Condition not met within timeout'));
      }
    }, 100);
  });
}

// Predefined evaluations
async function predefinedEvaluations(scriptId) {
  switch (scriptId) {
    case 'checkSuccess':
      return document.body.textContent.includes('Success');
    // Add more predefined scripts as needed
    default:
      throw new Error(`Unknown scriptId: ${scriptId}`);
  }
}

/* End of Selection */

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === "captureAndFill") {
        console.log('Capturing screenshot and HTML');
        captureScreenshot().then(imageDataUrl => {
            const htmlContent = document.body.outerHTML;
            console.log('Screenshot captured, HTML content length:', htmlContent.length);
            chrome.runtime.sendMessage({
                action: "processAI",
                prompt: request.prompt,
                html: htmlContent,
                screenshot: imageDataUrl
            });
            console.log('Sent data to background script for AI processing');
        });
    } else if (request.action === "executeInstructions") {
        console.log('Executing instructions received from AI');
        const result = await executeActions(request.instructions);
        sendResponse(result);
    }
    return true; // Indicates that we will send a response asynchronously
});

function captureScreenshot() {
    console.log('Capturing screenshot');
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error capturing screenshot:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.imageDataUrl) {
                console.log('Screenshot captured successfully');
                resolve(response.imageDataUrl);
            } else {
                console.error('Failed to capture screenshot');
                reject(new Error("Failed to capture screenshot"));
            }
        });
    });
}
