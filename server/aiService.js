import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

let geminiModel = null;
let openaiClient = null;
let geminiInitialized = false;
let openaiInitialized = false;

function initGemini() {
  if (geminiInitialized) return geminiModel;
  geminiInitialized = true;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    if (!geminiApiKey.startsWith('AIzaSy')) {
      console.warn('WARNING: The provided GEMINI_API_KEY does not start with AIzaSy and is likely invalid.');
    }
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('Gemini AI service initialized.');
    } catch (err) {
      console.error('Failed to initialize Gemini AI client', err);
    }
  } else {
    console.log('GEMINI_API_KEY is not defined. Using doubt solver mock responses.');
  }
  return geminiModel;
}

function initOpenAI() {
  if (openaiInitialized) return openaiClient;
  openaiInitialized = true;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey) {
    try {
      openaiClient = new OpenAI({ apiKey: openaiApiKey });
      console.log('OpenAI service initialized.');
    } catch (err) {
      console.error('Failed to initialize OpenAI client', err);
    }
  } else {
    console.log('OPENAI_API_KEY is not defined. Using summarizer mock responses.');
  }
  return openaiClient;
}

export async function askDoubt({ bookTitle, subject, pageNumber, pageContent, doubtHistory, userDoubt }) {
  const client = initOpenAI();
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (openaiApiKey && !openaiApiKey.startsWith('sk-')) {
    return `🤖 **[Testbook Guru]**\n\n⚠️ **Invalid API Key:** The OpenAI API key provided (\`${openaiApiKey.substring(0,8)}...\`) is invalid. Real OpenAI keys always start with \`sk-\`.\n\nPlease generate a valid key and update your \`.env\` file.`;
  }
  const prompt = `
    You are an expert tutor named "Testbook Guru" on the study platform "Testbook".
    Do NOT mention that you are an AI developed by Google or OpenAI. Always introduce yourself as Testbook Guru.
    A student is asking a doubt regarding the book "${bookTitle}" on the subject "${subject}".
    
    Here is the content of the current page (Page ${pageNumber}) they are reading:
    """
    ${pageContent || 'No text content available on this page.'}
    """
    
    Provide a short, to-the-point explanation in exactly 3-4 lines. 
    Keep it concise to save reading time.
    Reference the page content context briefly where appropriate.
  `;

  if (client) {
    try {
      const messages = [
        { role: 'system', content: prompt },
        ...doubtHistory,
        { role: 'user', content: userDoubt }
      ];
      
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error('OpenAI API call failed:', err);
      return `🤖 **[Testbook Guru]**\n\n⚠️ **API Error:** The AI encountered an error while processing your request: \n\`${err.message}\`\n\nPlease check your API key configuration.`;
    }
  }

  // Simulated typing and response fallback
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return `🤖 **[Testbook Guru]**

Hello! Since **OPENAI_API_KEY** is not configured, I'm responding as a fallback AI tutor assistant.

I see you are studying **${subject}** from the book **"${bookTitle}"** (Page ${pageNumber}). 

You asked: *"${userDoubt}"*

Based on the page context:
> "${pageContent && pageContent.length > 150 ? pageContent.substring(0, 150) + '...' : pageContent || 'General page topic'}"

**Explanation:**
1. This topic is highly relevant for competitive exams. Understanding the core concept is essential.
2. In typical exams, questions on this section test your conceptual clarity and application skills.
3. Make sure to note down the definitions and key formulas or dates mentioned on this page.

*Tip: Add a personal Note on Page ${pageNumber} or highlight the key lines for quick revision!*`;
}

export async function summariseContent({ bookTitle, subject, pageStart, pageEnd, contentText }) {
  const client = initOpenAI();
  const prompt = `
    You are an elite academic editor named "Testbook Guru" on the study platform "Testbook".
    Do NOT mention that you are an AI developed by OpenAI or Google.
    Summarize the following textbook content extracted from pages ${pageStart} to ${pageEnd} of "${bookTitle}" (Subject: ${subject}) for a competitive exam student.
    Format the output into clean, structured markdown with:
    - A detailed overview.
    - Key takeaways / Bulleted core concepts.
    - Potential exam questions or terms to remember.
    
    Here is the content text:
    """
    ${contentText || 'Empty page content.'}
    """
  `;

  if (client) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error('OpenAI API call failed, falling back to mock.', err);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 2000));
  const textSnippets = contentText 
    ? contentText.split('\\n').filter(l => l.trim().length > 10).slice(0, 5) 
    : ['Concepts related to ' + subject];

  return `🤖 **[Testbook Guru]**

### Smart Summary: ${bookTitle} (Pages ${pageStart} - ${pageEnd})
*Subject: ${subject}*

#### 1. Executive Summary
This section covers foundational principles of **${subject}**. It sets up concepts that frequently feature in competitive exams, testing both factual recall and deep logical reasoning.

#### 2. Key Takeaways & Core Concepts
${textSnippets.map(snippet => `- **Topic Highlight**: "${snippet.trim()}"`).join('\\n') || '- **Topic Highlight**: General textbook concepts.'}
- **Crucial Formula/Fact**: Review the structural definitions and charts displayed on these pages.
- **Exam Strategy**: Questions often focus on chronological order or causality of the points discussed.

#### 3. Terms to Remember & Exam Focus
- **Term A**: The main definitions in the text.
- **Practice Focus**: Be prepared to solve questions regarding the direct applications of these facts.

*(Note: Configure **OPENAI_API_KEY** in the server environment to get actual GPT-4o summaries.)*`;
}
