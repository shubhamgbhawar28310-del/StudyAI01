// Test script to verify AI service returns clean markdown text instead of JSON
const { generateNotes, generateStudyPlan, generateFlashcards, generateQuiz } = require('./src/services/aiService');

async function testAIResponseFormat() {
  console.log('Testing AI response format...');
  
  try {
    // Test notes generation
    console.log('\n1. Testing notes generation:');
    const notes = await generateNotes('C++ operators, data types, expressions and conditional statements');
    console.log('Notes response:', JSON.stringify(notes, null, 2));
    
    // Test study plan generation
    console.log('\n2. Testing study plan generation:');
    const studyPlan = await generateStudyPlan('Create a study plan for learning C++ basics');
    console.log('Study plan response:', JSON.stringify(studyPlan, null, 2));
    
    // Test flashcards generation
    console.log('\n3. Testing flashcards generation:');
    const flashcards = await generateFlashcards('Create flashcards for C++ operators');
    console.log('Flashcards response:', JSON.stringify(flashcards, null, 2));
    
    // Test quiz generation
    console.log('\n4. Testing quiz generation:');
    const quiz = await generateQuiz('Create a quiz about C++ data types');
    console.log('Quiz response:', JSON.stringify(quiz, null, 2));
    
  } catch (error) {
    console.error('Error testing AI response format:', error);
  }
}

testAIResponseFormat();