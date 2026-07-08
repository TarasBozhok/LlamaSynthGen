import path from 'node:path';
import { styleText } from 'node:util';
import { getLlama } from 'node-llama-cpp';
import log from './loggerer.js';
import TOKENS from './tokens.js';

const ACTORS_NUM = 2;
const ROUNDS_NUM = 5;

var sequenseEvaluateOptions = {
    cachePrompt: false,
    temperature: 1
};

log('START');

const TODAY_FORMATTED = (new Date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '');
var getPrompt = getPromptFunction.bind(this, TODAY_FORMATTED);

var modelPath = path.join(process.env.MODEL_PATH, process.env.MODEL_NAME);
var model = await Promise.resolve()
    .then(getLlama)
    .then((llama) => llama.loadModel({ modelPath }));
var context = await model.createContext();
var sequence = context.getSequence();
var inferModel = inferenceFunction.bind(this, sequence, model);

var actors = {};
//Take into account possible glitches
while ('error' in actors || Object.keys(actors).length !== ACTORS_NUM) {
    actors = await getActors(ACTORS_NUM);
}
var topic = await getTopic();

var actorNames = Object.keys(actors);
var discussion = [];
var systemPrompt = 'You always respond with input.';
var discussionStarterText = `Let's start the discussion.`;
var responseIterator = getActorResponseIterator(systemPrompt, discussionStarterText);

for (var round = 0; round <= ROUNDS_NUM; round++) {
    console.log( styleText(['green', 'bold'], `round: ${round}`) );
    for (var actorName in actorNames) {
        systemPrompt = `
            You are ${actorName} who is having a discussion with ${actorNames.filter((actorNameEl) => actorNameEl !== actorName).join(' and ') } about ${topic}.
            ${actors[actorName]}.
            Respond with no more than 3 sentences.
        `;

        var response = (await responseIterator.next([systemPrompt, discussionStarterText])).value;
        var discussionEntry = `${actorName}: ${response}`;
        discussion.push(discussionEntry);
        console.log( styleText(['green', 'bold'], discussionEntry) );
        if (discussion.length > 1) discussionStarterText = discussionEntry;
    }
}
responseIterator.return();

log('END');
log(discussion);

async function getActors(actorsNum) {
    var systemPrompt = `You are a helpful assistant. Your responses are presice, without extra words or characters.`;

    var discussionStarterText = `
        Generate a numbered list of ${actorsNum} items. Each item should start from famous persona name, then a pipe('|') character then no more than 3 sentences this persona's description for LLM to be used as prompt.
    `;

    return inferModel(
            getPrompt(systemPrompt, discussionStarterText)
        )
        .then((response) => {
            const ORDERED_LIST_ITEM = /\d\s?\./;
            var processedResponse = response.slice(response.search(ORDERED_LIST_ITEM));
            var chunks = processedResponse.split(ORDERED_LIST_ITEM).filter(Boolean);
            var actors = chunks.reduce((acc, el) => {
                var [name, description] = el.split('|').map((el) => el.trim());
                acc[name] = description;
                return acc;
            }, {});

            return actors;
        })
        .catch((e) => ({ error: true, e }));
}

async function getTopic(actorsNum) {
    var systemPrompt = 'You are a helpful assistant';
    var discussionStarterText = `Generate topic name that could be used for a discussion between ${actorsNum} people. Keep it short.`;

    return inferModel(
            getPrompt(systemPrompt, discussionStarterText)
        )
        .then((response) => response.replace(/[^\w\s]/g, ''));
}

async function inferenceFunction(sequence, model, text, options={ keepHistory: false, specialTokens: true }) {
    if (!options.keepHistory ) await sequence.clearHistory();

    var lastTen = [],
        generated = [];
    var tokenizedInput = model.tokenize(text, options.specialTokens);

    for await (var generatedToken of sequence.evaluate(tokenizedInput, sequenseEvaluateOptions)) {
        generated.push(generatedToken);

        if (!options.specialTokens) {
            lastTen = lastTen.length >= 10 ? [...lastTen.slice(1), generatedToken] : generated;

            if (model.detokenize(lastTen).includes(TOKENS.EOT)) break;
        }
    }

    var modelOutput = model.detokenize(generated, options.specialTokens);
    if (!options.specialTokens) modelOutput = modelOutput.replace(/<\|\w+\|>/g, '');

    return modelOutput.trim();
}

function getPromptFunction(todayFormatted, systemPrompt, userMessage) {

    return `
        <|begin_of_text|><|start_header_id|>system<|end_header_id|>

        Cutting Knowledge Date: December 2023
        Today Date: ${todayFormatted}
        ${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>

        ${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
}

async function* getActorResponseIterator(systemPrompt, discussionStarterText) {
    while (true) {
        [systemPrompt, discussionStarterText] = yield inferModel(getPrompt(systemPrompt, discussionStarterText));
    }
}
