import path from 'node:path';
import { styleText } from 'node:util';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { getLlama } from 'node-llama-cpp';
import TOKENS from './tokens.js';
import getUserInput from './userInput.js';

const {ACTORS_NUM, ROUNDS_NUM, DEBUG_MODE} = await getUserInput('ACTORS_NUM', 'ROUNDS_NUM', 'DEBUG_MODE');

const USE_EXTRA_DESCRIPTION = true;
const TOPIC_PLACEHOLDER = '{{TOPIC}}';

var debug = DEBUG_MODE ? debugFunction : () => {};

var sequenseEvaluateOptions = {
    cachePrompt: false,
    temperature: 1,
    seed: generateSeed()
};

debug('START');

if (!process.env.MODEL_PATH || !process.env.MODEL_NAME) {
    logConsoleError('Missing required params.');
    process.exit(1);
}

const TODAY_FORMATTED = (new Date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '');
var getPrompt = getPromptFunction.bind(this, TODAY_FORMATTED);

var modelPath = path.join(process.env.MODEL_PATH, process.env.MODEL_NAME);
try {
    var model = await getLlama().then((llama) => llama.loadModel({ modelPath }));
} catch (e) {
    logConsoleError('Error loading model. Exit.');
    logConsoleError(e);
    process.exit(1);
}
var context = await model.createContext();
var sequence = context.getSequence();
var inferModel = inferenceFunction.bind(this, sequence, model);

var loopBreaker = 5;
do {
    var actors = await getActors(ACTORS_NUM, USE_EXTRA_DESCRIPTION);
    sequenseEvaluateOptions.seed = generateSeed();
} while (loopBreaker-- > 0 && ('error' in actors || actors.length !== ACTORS_NUM || !actors.every((actor) => Object.values(actor).every(Boolean))))

if (loopBreaker <= 0) {
    await model.dispose();
    logConsoleError(`Model can not follow the instructions. Exit.`);
    debug('actors', actors);
    process.exit(1);
}

var topic = await getTopic();
resetTopic(actors, null/*oldTopic*/, topic);

var discussion = [];
var initialSystemPrompt = 'You are a precise response generator. Your task is to reproduce the exact input received. No interpretation, no explanation, no formatting changes - just the raw input as provided.';
var discussionStarterText = `Let us start the discussion on ${topic}`;
var responseIterator = getActorResponseIterator(initialSystemPrompt, discussionStarterText);

for (var round = 0; round <= ROUNDS_NUM; round++) {
    for (var actor of actors) {
        var response = (await responseIterator.next([actor, discussionStarterText])).value;
        var discussionEntry = `${actor.name}: ${response}`;
        discussionStarterText = discussionEntry;
        discussion.push(discussionEntry);
    }
}
responseIterator.return();
model.dispose();

saveDiscussion(discussion);
debug('END');

async function getActors(actorsNum, useExtraDescription) {
    var systemPrompt = `You are a helpful assistant. Your responses are presice, without extra words or characters.`;

    var discussionStarterText = `
        Generate a numbered list of ${actorsNum} items. Each item should start from famous persona name${useExtraDescription ? ", then a pipe('|') character then no more than 3 sentences this persona's description for LLM to be used as prompt." : '.'}
    `;

    return inferModel(
            getPrompt(systemPrompt, discussionStarterText)
        )
        .then((response) => {
            const ORDERED_LIST_ITEM = /\D?\d\.\s*\W*/;// 1.; 2.; etc. Not: 1923.
            var actors = response
                .split(ORDERED_LIST_ITEM)
                .slice(1)
                .filter(Boolean)
                .map((el) => {
                    var [name, description] = el.split('|').map((el) => el.trim());
                    return { name, description };
                }, {});

            return actors;
        })
        .then((parsedActors) => {
            parsedActors.forEach((currentActor) => {
                currentActor.systemPrompt = `
                    You are ${currentActor.name} who is having a discussion with ${parsedActors.filter((actor) => actor.name !== currentActor.name).join(' and ') } about ${TOPIC_PLACEHOLDER}.
                    ${useExtraDescription ? currentActor.description : ''}
                    ${parsedActors.length > 2 ? 'Do not respond in person. ' : ''}Respond with no more than 3 sentences.
                `;
            });

            return parsedActors;
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

async function inferenceFunction(sequence, model, text, options={ keepHistory: false, specialTokens: true, streamTokens: () => {} }) {
    if (!options.keepHistory ) await sequence.clearHistory();

    var lastTen = [],
        generated = [];
    var tokenizedInput = model.tokenize(text, options.specialTokens);

    for await (var generatedToken of sequence.evaluate(tokenizedInput, sequenseEvaluateOptions)) {
        generated.push(generatedToken);
        options.streamTokens(model.detokenize([generatedToken], options.specialTokens));

        if (!options.specialTokens) {
            lastTen = lastTen.length >= 10 ? [...lastTen.slice(1), generatedToken] : generated;

            if (model.detokenize(lastTen).includes(TOKENS.EOT)) break;
        }
    }
    options.streamTokens('\n');

    var modelOutput = model.detokenize(generated, options.specialTokens);
    if (!options.specialTokens) modelOutput = modelOutput.replace(/<\|\w+\|>/g, '');

    debug('modelOutput', modelOutput);

    return modelOutput.trim();
}

function getPromptFunction(todayFormatted, systemPrompt, userMessage) {

    return `
        ${TOKENS.BOT}${TOKENS.SHI}system${TOKENS.EHI}

        Cutting Knowledge Date: December 2023
        Today Date: ${todayFormatted}
        ${systemPrompt}${TOKENS.EOT}${TOKENS.SHI}user${TOKENS.EHI}

        ${userMessage}${TOKENS.EOT}${TOKENS.SHI}assistant${TOKENS.EHI}
    `;
}

async function* getActorResponseIterator(initialSystemPrompt, discussionStarterText) {
    var inferParams = { keepHistory: false, specialTokens: true, streamTokens: process.stdout.write.bind(process.stdout) };
    var actor = {};
    var systemPrompt = initialSystemPrompt;

    while (true) {
        var inferPrompt = getPrompt(systemPrompt, discussionStarterText);
        debug('inferPrompt', inferPrompt);

        if (actor.name) console.log( styleText(['green', 'bold'], actor.name) );
        [actor, discussionStarterText] = yield inferModel(inferPrompt, inferParams);

        systemPrompt = actor.systemPrompt;
        debug('new systemPrompt', systemPrompt);
        debug('new discussionStarterText', discussionStarterText);
    }
}

function saveDiscussion(discussion) {
    var currentDirPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'discussions');
    var fileName = `${(new Date).getTime()}.txt`;
    var contents = typeof discussion === 'string' ? discussion : null;
    if (!contents && Array.isArray(discussion)) contents = discussion.join('\n');
    if (!contents && typeof discussion === 'object') contents = JSON.stringify(discussion);

    try {
        if (!fs.existsSync(currentDirPath)) fs.mkdirSync(currentDirPath)
        fs.writeFileSync(path.join(currentDirPath, fileName), contents);
    } catch (err) {
        logConsoleError(err.toString());
    }
}

function debugFunction(...entries) {
    console.log( styleText(['green', 'bold'], entries.shift()), ...entries );
}

function logConsoleError(msgObj) {
    var msg = msgObj instanceof Error ? `${msgObj.message}: ${msgObj.cause}` : msgObj.toString();
    console.error( styleText(['red', 'bold'], 'ERROR:'), msg );
}

function generateSeed() {
    return Math.round(Math.random() * 2**32);
}

function resetTopic (actors, oldTopic=TOPIC_PLACEHOLDER, newTopic) {
    actors.forEach( (actor) => actor.systemPrompt.replaceAll(oldTopic, newTopic) );
}