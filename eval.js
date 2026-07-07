import path from 'node:path';
import { getLlama } from 'node-llama-cpp';
import log from './loggerer.js';
import TOKENS from './tokens.js';

const ACTORS_NUM = 2;
const ROUNDS_NUM = 5;
const SPECIAL_TOKENS_FLAG = true;

var sequenseEvaluateOptions = {
    cachePrompt: false,
    repeatPenalty: 10,
    temperature: 1
};

log('START');

var modelPath = path.join(process.env.MODEL_PATH, process.env.MODEL_NAME);

var model = await Promise.resolve()
    .then(getLlama)
    .then((llama) => llama.loadModel({ modelPath }));
var context = await model.createContext();
var sequence = context.getSequence();
var inferModel = inferenceFunction.bind(this, sequence, model);

//Take into account possible glitches
while (actors.length !== ACTORS_NUM) {
    var actors = await getActors(ACTORS_NUM);
    log(actors);
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
    var systemPrompt = 'You are a helpful assistant';
    var discussionStarterText = `Return JSON of structure: key - generate a famous persona name with extraordinary speech patterns, value - generate an instruction for LLM model to behave as this persona, keep it short. The number of object entries is ${actorsNum}`;

    return inferModel(
            getPrompt(systemPrompt, discussionStarterText)
        )
        .then((response) => {
            return JSON.parse(response.replace(/<\|\w+\W*\|>/g, ''));
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