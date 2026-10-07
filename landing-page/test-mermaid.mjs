import mermaid from 'mermaid';
import { JSDOM } from 'jsdom';

// Setup DOM for DOMPurify to work in Node
const dom = new JSDOM('');
global.window = dom.window;
global.document = dom.window.document;
global.DOMPurify = window.DOMPurify;

const architectureDiagram = `
flowchart TD
    Start((Trigger Analysis)) --> FetchPrice[1. Fetch 30D OHLCV Data]
    Start --> FetchNews[1. Fetch Asset Specific News]
    
    FetchPrice --> MathNode[2. Compute RSI, MACD, Bollinger Bands, Volatility]
    FetchNews --> NLPNode[3. FinBERT Sentiment Scoring - Pos/Neu/Neg]
    
    MathNode --> Context(4. Build Massive Context Prompt)
    NLPNode --> Context
    
    Context --> LLM{5. qwen/qwen3.8-27b LLM}
    
    LLM --> JSONParse[6. Output Strict JSON Payload]
    JSONParse --> DB[(7. Save JSON to Postgres)]
    DB --> UI((8. Display to User))
`;

async function test() {
  try {
    const result = await mermaid.parse(architectureDiagram);
    console.log("Success");
  } catch (e) {
    console.error("Error parsing:", e);
  }
}

test();
