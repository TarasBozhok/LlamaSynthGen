import path from 'node:path';
import { getLlama } from 'node-llama-cpp';
import log from './loggerer.js';
import TOKENS from './tokens.js';

const ACTORS_NUM = 2;
const ROUNDS_NUM = 5;
const SPECIAL_TOKENS_FLAG = true;

var sequenseEvaluateOptions = {
    cachePrompt: false,
    temperature: 1.1
};

log('START');

var modelPath = path.join(process.env.MODEL_PATH, process.env.MODEL_NAME);

var model = await Promise.resolve()
    .then(getLlama)
    .then((llama) => llama.loadModel({ modelPath }));
var context = await model.createContext();
var sequence = context.getSequence();
var inferModel = inferenceFunction.bind(this, sequence, model);

var actors = [];
//Take into account possible glitches
while (actors.length !== ACTORS_NUM) {
    actors = await getActors(ACTORS_NUM);
}

var topic = await getTopic();
var discussionStarterText = `Let's start the discussion with the topic ${topic}`;

var accumulatedDiscussion = [];
for (var round = 0; round <= ROUNDS_NUM; round++) {
    //void
}

log(actors);
log(topic);

log('END');

async function getActors(actorsNum) {
    var systemPrompt = `
    You are a JavaScript expert AI assistant. When responding with data structures, you must ALWAYS return valid JavaScript objects as JSON strings. Follow these strict rules:

    1. **Always wrap objects in double quotes** - Return the entire object as a single JSON string
    2. **Use proper JSON syntax** - All keys must be quoted, use valid JSON formatting
    3. **No markdown formatting** - No \`\`\`javascript or \`\`\`json backticks
    4. **No explanations** - Only return the raw JSON string
    5. **Valid JavaScript objects only** - No arrays, strings, or other types unless they're part of a valid object

    Examples of correct responses:
    "{\"name\": \"John\", \"age\": 30}"
    "{\"status\": \"success\", \"data\": {\"id\": 1}}"
    "{\"error\": \"Invalid input\", \"code\": 400}"

    Examples of incorrect responses:
    "{name: John, age: 30}" (missing quotes around keys)
    "{\"name\": \"John\", \"age\": 30}" (extra characters)
    "Name: John, Age: 30" (not an object)`;

    var discussionStarterText = `
        Generate an object with ${actorsNum} keys. Every key is a famous persona name with extraordinary speech patterns. Every value is an instruction for LLM model to generate responses as this persona would respond.
    `;

    return inferModel(
            getPrompt(systemPrompt, discussionStarterText)
        )
        .then((response) => {
            var cleanResp = response.slice(response.indexOf('{'), response.lastIndexOf('}'));
            log(cleanResp);
            return JSON.parse(cleanResp);
        })
        .catch(() => ({ error: true }));
}

async function getTopic(actorsNum) {
    var systemPrompt = 'You are a helpful assistant';
    var discussionStarterText = `Generate topic name that could be used for a discussion between ${actorsNum} people. Keep it short, no special characters, letters only.`;

    return inferModel(
        getPrompt(systemPrompt, discussionStarterText))
            .then((response) => response.replace(/<\|\w+.*/g, '').trim().replace(/\W/g, '')
    );
}

async function inferenceFunction(sequence, model, text) {
    await sequence.clearHistory();
    var lastTen = [],
        generated = [];

    for await (var generatedToken of sequence.evaluate(model.tokenize(text, SPECIAL_TOKENS_FLAG), sequenseEvaluateOptions)) {
        generated.push(generatedToken);

        // lastTen = lastTen.length >= 10 ? [...lastTen.slice(1), generatedToken] : generated;
        // var lastTenDetokenized = model.detokenize(lastTen);
        // if (lastTenDetokenized.includes(TOKENS.EOT)) break;
    }

    return model.detokenize(generated, SPECIAL_TOKENS_FLAG);
}

function getPrompt(systemPrompt, userMessage) {
    var todayFormatted = (new Date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '');

    return `
        <|begin_of_text|><|start_header_id|>system<|end_header_id|>

        Cutting Knowledge Date: December 2023
        Today Date: ${todayFormatted}
        ${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>

        ${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
}