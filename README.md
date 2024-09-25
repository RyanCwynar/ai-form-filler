# Form Filler AI Extension

This is a chrome extension that you can load unpacked and it's goal is to fill any form.

It takes a screenshot of the page and sends to HTML off to gpt-4o-mini, and then it creates a list of instructions for the form filler which it then executes.

# Setup
1. Add your open ai api key in background.js
2. Load extension unpacked in Brave or Chrome

## Next Steps
1. Add an interface to review/edit the steps returned
2. Add steps to send individual requests of text areas, like proposals and longer text blocks
3. Test on more variations of forms
4. Add an area to save common user information which can be drawn from when filling out forms
