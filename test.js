import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

// Ensure the API Key is loaded
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ Error: GEMINI_API_KEY not found in .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function run() {
  // Model as requested by the USER: gemini-2.5-flash
  const MODEL_NAME = "gemini-2.5-flash";
  
  console.log("-----------------------------------------");
  console.log(`🚀 Testing Gemini API with model: ${MODEL_NAME}`);
  console.log("-----------------------------------------");

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = "Explain the rules of Dynamic Tic Tac Toe in 3 simple sentences.";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ API Success! Response:");
    console.log(text);
  } catch (error) {
    console.error("❌ API Call Failed:");
    console.error(error.message);
    
    if (error.message.includes("404")) {
      console.log("\n⚠️  Note: 'gemini-2.5-flash' might be a typo or not yet publicly available.");
      console.log("Try using 'gemini-1.5-flash' or 'gemini-2.0-flash-exp' if this persists.");
    }
  }
}

run();
