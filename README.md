# tl;dr Me

A Google Chrome extension to summarize web pages. Built using DeepSeek, Gemini 2.0, and bolt.new.

## How It Was Developed

1. Brainstormed ideas with group members, which eventually led to this project.
2. Prepared a product requirements document in a plaintext file with the help of DeepSeek.
3. Used the product requirements document as a prompt in bolt.new.
4. Iterated 2–3 times using prompting to refine the generated code. Some modifications made via prompting:
   1. Replaced the mock summarizer function with an actual function that calls the Gemini API.
   2. Added a string cleaner to filter out non-alphanumeric symbols from the web page.

## Installation

1. Clone the repository.
2. Update [`content.js`](./content.js) by adding your API key for Google Gemini 2.0.
3. Open the "Manage Extensions" tab in Google Chrome by visiting `chrome://extensions`.
4. Click "Load unpacked" and select the directory containing the cloned repository.
5. Open a web page and try running the summarizer!

## Acknowledgements

- AI Builder Co-working event organized by Build Cloud on February 15, 2025, at SIRCLO HQ in BSD City.
- Builder group number 5, consisting of Mas Awan, Mas Putra, myself, and one other person (apologies, I forgot your name 🙏).

## License

This project is released into the public domain.
