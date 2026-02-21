
import { analyzeQuery } from './services/aiService.js';

const testCases = [
    "I need to draft a rent agreement for my flat in Dehradun",
    "What is the difference between Section 420 IPC and BNS?",
    "Police arrested my brother without warrant yesterday night",
    "My company needs to file GST returns for last quarter",
    "Can I file a writ petition u/s 226 for this impugned order?",
    "Help me I am feeling suicidal and my husband is beating me",
    "Is bitcoin legal in India?"
];

console.log("--- INTENT DETECTION TEST ---");
testCases.forEach(prompt => {
    const result = analyzeQuery(prompt);
    console.log(`\nHint: "${prompt.substring(0, 30)}..."`);
    console.log(`Intent: ${result.intent}`);
    console.log(`Expertise: ${result.userExpertise}`);
    console.log(`Urgency: ${result.urgency}`);
    console.log(`Mode: ${result.mode}`);
});
