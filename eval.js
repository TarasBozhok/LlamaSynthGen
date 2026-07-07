import path from 'node:path';
import { getLlama } from 'node-llama-cpp';
import log from './loggerer';
import TOKENS from './tokens';

const ACTORS_NUM = 2;
const ROUNDS_NUM = 5;

log('START');

var modelPath = path.join(process.env.MODEL_PATH, process.env.MODEL_NAME);

var model = await Promise.resolve()
    .then(getLlama)
    .then((llama) => llama.loadModel({ modelPath }));
var context = await model.createContext();
var sequence = context.getSequence();
var inferModel = inferenceFunction.bind(this, sequence, model);

var actors = await getActors(ACTORS_NUM);
actors = Array.isArray(actors) ? actors : [];
actors.forEach(log);

var topic = await getTopic();
log(topic);
var discussionStarterText = `Let's start the discussion with the topic ${topic}`;


log('END');

async function getActors(actorsNum) {
    var systemPrompt = 'You are a helpful assistant';
    var discussionStarterText = `Generate a list of ${actorsNum} famous personas with extraordinary speech patterns. First and last names only. Separate one from another by '|' character. Keep it short, the list only.`;

    return inferModel(getPrompt(systemPrompt, discussionStarterText)).then((response) => response.replace('| ', '|').replace(/<\|\w+\W*\|>/g, '').split('|'));
}

async function getTopic(actorsNum) {
    var systemPrompt = 'You are a helpful assistant';
    var discussionStarterText = `Respond as short as possible: generate topic name that could be used for a discussion between ${actorsNum} people.`;

    return inferModel(getPrompt(systemPrompt, discussionStarterText)).then((response) => response.replace(/<\|\w+.*/g, ''));
}

async function inferenceFunction(sequence, model, text) {
    var lastTen = [],
        generatedAll = [];
    var cntr = 0;
    for await (var generatedToken of sequence.evaluate(model.tokenize(text, true))) {
        lastTen = lastTen.length === 10 ? [...lastTen.slice(1), generatedToken] : generatedAll;
        generatedAll.push(generatedToken);

        var lastTenDetokenized = model.detokenize(lastTen);
        if (cntr++ % 10 === 0) {
            log('detokenized last ten: ' + lastTenDetokenized);
        }
        if (lastTenDetokenized.includes(TOKENS.EOT)) break;
    }

    return model.detokenize(generatedAll);
}

function getPrompt(systemPrompt, userMessage) {
    var todayFormatted = (new Date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '');

    return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Cutting Knowledge Date: December 2023
Today Date: ${todayFormatted}
${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>

${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
}