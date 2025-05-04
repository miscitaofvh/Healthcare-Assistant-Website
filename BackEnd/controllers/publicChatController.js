import ollama from 'ollama';
import dotenv from 'dotenv';
import connection from '../config/connection.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

export const handleStreamingChat = async (req, res) => {
  try {
    const { message, history, conversationId } = req.body;
    let responseConversationId = conversationId;
    let isNewConversation = false;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Format the conversation history for the AI model
    const formattedHistory = history ? history.map(msg => ({
      role: msg.role,
      content: msg.content
    })) : [];

    // Add the current message
    formattedHistory.push({
      role: 'user',
      content: message
    });

    // If the user is authenticated and there's no conversationId, create a new conversation
    if (req.user && !conversationId) {
      // Create a new conversation with the first message as the title
      const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
      
      // Generate and check for a unique UUID
      let uniqueId = null;
      const conn = await connection.getConnection();
      try {
        let isUnique = false;
        while (!isUnique) {
          // Generate a new UUID
          const generatedId = uuidv4();
          
          // Check if this UUID already exists in the database
          const [existingConversations] = await conn.execute(
            'SELECT conversation_id FROM chatbot_conversations WHERE conversation_id = ?',
            [generatedId]
          );
          
          if (existingConversations.length === 0) {
            // This ID doesn't exist yet, so we can use it
            uniqueId = generatedId;
            isUnique = true;
          } else {
            console.log(`Generated conversation ID ${generatedId} already exists in database, trying again...`);
          }
        }
        
        responseConversationId = uniqueId;
        isNewConversation = true;
        
        await conn.beginTransaction();
        
        // Insert the conversation
        const conversationQuery = `
          INSERT INTO chatbot_conversations (
            conversation_id,
            user_id,
            title
          ) VALUES (?, ?, ?)
        `;
        await conn.execute(conversationQuery, [responseConversationId, req.user.user_id, title]);
        
        // Insert the user message
        const messageId = uuidv4();
        const messageQuery = `
          INSERT INTO chatbot_messages (
            message_id,
            conversation_id,
            sender_type,
            sender_id,
            message_text
          ) VALUES (?, ?, ?, ?, ?)
        `;
        await conn.execute(messageQuery, [
          messageId,
          responseConversationId,
          'user',
          req.user.user_id,
          message
        ]);
        
        await conn.commit();
      } catch (error) {
        await conn.rollback();
        console.error('Error creating conversation:', error);
        // Continue with the chat even if saving fails
      } finally {
        conn.release();
      }
    }
    
    // Save the user message if user is authenticated and conversation already exists
    if (req.user && conversationId && !isNewConversation) {
      try {
        const messageId = uuidv4();
        const conn = await connection.getConnection();
        const messageQuery = `
          INSERT INTO chatbot_messages (
            message_id,
            conversation_id,
            sender_type,
            sender_id,
            message_text
          ) VALUES (?, ?, ?, ?, ?)
        `;
        await conn.execute(messageQuery, [
          messageId,
          conversationId,
          'user',
          req.user.user_id,
          message
        ]);
        conn.release();
      } catch (error) {
        console.error('Error saving user message:', error);
        // Continue with the chat even if saving fails
      }
    }

    // If this is a new conversation, send the conversation ID in the response header
    // Setting header BEFORE writing any data to the response
    if (isNewConversation) {
      res.setHeader('X-Conversation-Id', responseConversationId);
      
      // Also send the conversation ID as a special message at the start of the stream
      // This ensures clients will receive it even if they don't check headers
      res.write(`CONVERSATION_ID:${responseConversationId}\n\n`);
    }

    // Stream response from Ollama
    const stream = await ollama.chat({
      model: process.env.AI_MODEL_NAME || 'AMH_chatbot',
      messages: formattedHistory,
      stream: true
    });

    let assistantResponse = '';

    // Process the stream
    for await (const part of stream) {
      if (part.message?.content) {
        assistantResponse += part.message.content;
        res.write(part.message.content);
      }
    }
    
    // Save the assistant's response if user is authenticated and we have a conversation ID
    if (req.user && (responseConversationId || conversationId)) {
      try {
        const messageId = uuidv4();
        const conn = await connection.getConnection();
        const messageQuery = `
          INSERT INTO chatbot_messages (
            message_id,
            conversation_id,
            sender_type,
            message_text
          ) VALUES (?, ?, ?, ?)
        `;
        await conn.execute(messageQuery, [
          messageId,
          responseConversationId || conversationId,
          'bot',
          assistantResponse
        ]);
        conn.release();
      } catch (error) {
        console.error('Error saving assistant response:', error);
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Streaming chat API error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to process streaming chat request'
      });
    } else {
      res.write('\n\nSorry, an error occurred while generating the response.');
      res.end();
    }
  }
};
