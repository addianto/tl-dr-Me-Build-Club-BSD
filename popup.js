document.addEventListener('DOMContentLoaded', function() {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryLength = document.getElementById('summaryLength');
  const loadingState = document.getElementById('loadingState');
  const resultContainer = document.getElementById('resultContainer');
  const articleTitle = document.getElementById('articleTitle');
  const summaryContent = document.getElementById('summaryContent');
  const copyBtn = document.getElementById('copyBtn');
  const shareBtn = document.getElementById('shareBtn');
  const editTitleBtn = document.getElementById('editTitleBtn');

  summarizeBtn.addEventListener('click', async () => {
    loadingState.classList.remove('hidden');
    resultContainer.classList.add('hidden');

    // Send message to content script to get page content
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'summarize',
        length: summaryLength.value
      });

      loadingState.classList.add('hidden');
      resultContainer.classList.remove('hidden');

      articleTitle.textContent = response.title;
      summaryContent.innerHTML = response.summary
        .map(paragraph => `<p class="mb-4">${paragraph}</p>`)
        .join('');
    } catch (error) {
      loadingState.classList.add('hidden');
      alert('Could not generate summary. Please try again.');
    }
  });

  copyBtn.addEventListener('click', () => {
    const textToCopy = `${articleTitle.textContent}\n\n${
      Array.from(summaryContent.querySelectorAll('p'))
        .map(p => p.textContent)
        .join('\n\n')
    }`;
    
    navigator.clipboard.writeText(textToCopy);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 2000);
  });

  shareBtn.addEventListener('click', () => {
    const text = encodeURIComponent(`${articleTitle.textContent}\n\n${
      Array.from(summaryContent.querySelectorAll('p'))
        .map(p => p.textContent)
        .join('\n\n')
    }`);
    
    window.open(`mailto:?subject=${encodeURIComponent(articleTitle.textContent)}&body=${text}`);
  });

  editTitleBtn.addEventListener('click', () => {
    const currentTitle = articleTitle.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.style.width = '100%';
    
    articleTitle.replaceWith(input);
    input.focus();

    input.addEventListener('blur', () => {
      articleTitle.textContent = input.value;
      input.replaceWith(articleTitle);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });
  });
});