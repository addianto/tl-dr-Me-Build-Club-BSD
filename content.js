// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    // Get the main content of the page
    const article = extractArticleContent();
    
    // Use Gemini API for summarization
    summarizeWithGemini(article, request.length)
      .then(summary => sendResponse(summary))
      .catch(error => {
        console.error('Summarization error:', error);
        sendResponse({ error: 'Failed to generate summary' });
      });
    
    return true; // Required for async response
  }
});

function extractArticleContent() {
  // Try to find the main article content
  const selectors = [
    'article',
    '[role="article"]',
    '.post-content',
    '.article-content',
    'main',
  ];

  let content = '';
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = element.textContent;
      break;
    }
  }

  // Fallback to getting all paragraph text if no article container found
  if (!content) {
    content = Array.from(document.getElementsByTagName('p'))
      .map(p => p.textContent)
      .join(' ');
  }

  return content;
}

function cleanText(text) {
  return text
    // Replace common problematic characters
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes (single)
    .replace(/[\u201C\u201D]/g, '"') // Smart quotes (double)
    .replace(/[\u2013\u2014]/g, '-') // Em dash and en dash
    .replace(/\u2026/g, '...') // Ellipsis
    .replace(/[\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000]/g, ' ') // Various spaces
    .replace(/[\u00b4\u02c8\u02c9\u02ca\u02cb\u02dc\u2018\u2019\u201c\u201d]/g, "'") // Various apostrophes and accents
    .replace(/[^\x20-\x7E\n]/g, '') // Remove any other non-ASCII characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

async function summarizeWithGemini(text, length) {
  const API_KEY = ''; // TODO: Replace with your own API key
  const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

  const lengthMap = {
    short: 'Create a very concise 3-paragraph summary',
    medium: 'Create a balanced 5-paragraph summary',
    detailed: 'Create a comprehensive 7-paragraph summary'
  };

  const prompt = `
    Please analyze the following text and ${lengthMap[length]}.
    Format the response as a JSON object with two fields:
    1. "title": A concise, engaging title that captures the main topic
    2. "summary": An array of paragraphs, where each paragraph is a clear, complete thought
    
    Make sure each paragraph flows naturally into the next, creating a coherent narrative.
    
    Text to summarize:
    ${text}
  `;

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid API response format');
    }

    // Parse the JSON response from the model
    const generatedText = data.candidates[0].content.parts[0].text;
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(generatedText);
    } catch (e) {
      // If JSON parsing fails, attempt to extract content using regex
      const titleMatch = generatedText.match(/"title":\s*"([^"]+)"/);
      const summaryMatch = generatedText.match(/"summary":\s*\[([\s\S]+?)\]/);
      
      parsedResponse = {
        title: titleMatch ? titleMatch[1] : document.title,
        summary: summaryMatch 
          ? summaryMatch[1]
              .split('","')
              .map(s => s.replace(/^"|"$/g, '').replace(/\\"/g, '"'))
          : text.split('.').slice(0, lengthMap[length]).map(s => s.trim())
      };
    }

    return {
      title: cleanText(parsedResponse.title || document.title),
      summary: (parsedResponse.summary || []).map(cleanText)
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
