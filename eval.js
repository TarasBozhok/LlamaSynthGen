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

var actors = {};
//Take into account possible glitches
while ('error' in actors || Object.keys(actors).length !== ACTORS_NUM) {
    actors = await getActors(ACTORS_NUM);
}

var topic = await getTopic();
var discussionStarterText = `Let's start the discussion with the topic ${topic}`;

var accumulatedDiscussion = [discussionStarterText];
// for (var round = 0; round <= ROUNDS_NUM; round++) {
//     console.log('round: ', round);
//     Object.keys(actors).forEach(async (actorName) => {
//         console.log('actor: ', actorName);
//         var systemPrompt = `You are ${actorName}. ${actors[actorName]}`;

//         var response = await inferModel(getPrompt(systemPrompt, discussionStarterText));
//         log(response);
//         discussionStarterText = response;
//         accumulatedDiscussion.push(response);
//     });
// }

var responseIterator = getActorResponse();
for (var round = 0; round <= ROUNDS_NUM; round++) {
    console.log('round: ', round);
    Object.keys(actors).forEach(async (actorName) => {
        console.log('actor: ', actorName);

        var systemPrompt = `You are ${actorName}. ${actors[actorName]}`;
        var response = await responseIterator.next(systemPrompt, discussionStarterText).value;
        log(response);
        discussionStarterText = response;
        accumulatedDiscussion.push(response);
    });
}

log('END');


log(accumulatedDiscussion);

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
            var processedResponse = response.trim().slice(response.search(ORDERED_LIST_ITEM));
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

async function* getActorResponse(systemPrompt='You are a facilitator.', discussionStarterText='Greet all who are present.') {
    while (true) {
        var response = await inferModel(getPrompt(systemPrompt, discussionStarterText));
        yield response;
    }
}