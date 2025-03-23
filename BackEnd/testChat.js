const axios = require('axios');
const readline = require('readline');

// Configuration
const API_URL = 'http://localhost:5000/api/chat';
const TIMEOUT = 15000; // 15 seconds

// Create readline interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Send a chat message to the API and log the response
 * @param {string} message - The user message to send
 * @param {string} userId - User identifier
 * @param {Array} history - Chat history
 */
async function chatWithBot(message, userId = 'test-user-123', history = []) {
  console.log(`\n📤 Sending: "${message}"`);
  
  try {
    const startTime = Date.now();
    const response = await axios.post(API_URL, {
      userId,
      message: message.trim(),
      chatHistory: history,
      timestamp: new Date().toISOString()
    }, {
      timeout: TIMEOUT,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`\n📥 Bot (${responseTime}ms):`);
    console.log(`${response.data.response || "[No response]"}`);
    
    // Add both the user message and AI response to history in the format expected by the controller
    return {
      response: response.data,
      updatedHistory: [
        ...history,
        {
          role: 'User',
          content: message.trim(),
          timestamp: new Date().toISOString()
        },
        {
          role: 'AI',
          content: response.data.response || "",
          timestamp: response.data.timestamp || new Date().toISOString()
        }
      ]
    };
  } catch (error) {
    console.error('\n❌ ERROR:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: `, error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error: ', error.message);
    }
    return { updatedHistory: history }; // Return original history on error
  }
}

/**
 * Run automated tests with healthcare-related questions
 */
async function runAutomatedTests() {
  console.log('\n===== RUNNING AUTOMATED TESTS =====');
  
  const testCases = [
    "Hello, can you help me with some health questions?",
    "What are common symptoms of COVID-19?",
    "How can I schedule a doctor's appointment?",
    "What should I do for a mild headache?",
    "What are some tips for maintaining good heart health?"
  ];
  
  let history = [];
  
  for (const [index, question] of testCases.entries()) {
    console.log(`\n----- Test ${index + 1}/${testCases.length} -----`);
    const result = await chatWithBot(question, 'test-user-123', history);
    history = result.updatedHistory || history;
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ AUTOMATED TESTS COMPLETED');
}

/**
 * Start an interactive chat session with the bot
 */
async function startInteractiveChat() {
  console.log('\n===== INTERACTIVE CHAT MODE =====');
  console.log('Type your messages and press Enter. Type "exit" to quit.');
  
  let history = [];
  
  const askQuestion = () => {
    rl.question('\n💬 You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('Goodbye! 👋');
        rl.close();
        return;
      }
      
      const result = await chatWithBot(input, 'interactive-user', history);
      history = result.updatedHistory || history;
      askQuestion();
    });
  };
  
  askQuestion();
}

// Main function
async function main() {
  console.log('===== HEALTHCARE CHATBOT TESTER =====');
  console.log('1. Run automated tests');
  console.log('2. Start interactive chat');
  
  rl.question('Select an option (1/2): ', async (answer) => {
    if (answer === '1') {
      await runAutomatedTests();
      rl.close();
    } else if (answer === '2') {
      await startInteractiveChat();
    } else {
      console.log('Invalid option. Exiting.');
      rl.close();
    }
  });
}

// Start the program
main();



