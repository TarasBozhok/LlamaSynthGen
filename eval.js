import path from 'node:path';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

var modelPath = path.join(process.env.MODEL_PATH, process.env.MODEL_NAME);

var session = await Promise.resolve()
    .then(getLlama)
    .then((llama) => llama.loadModel({ modelPath }))
    .then((model) => model.createContext())
    .then((context) => new LlamaChatSession({
        contextSequence: context.getSequence()
    }));

Promise.resolve()
    .then(() => putQuestion(0))
    .then(printResponse)
    .then(() => putQuestion(1))
    .then(printResponse)

var questions = [
    'Hi there, how are you?',
    'Summarize what you said',
];

function putQuestion(index = 0) {
    console.log(`Que: ${index}`, questions[index]);
    return session.prompt(questions[index]);
}

function printResponse(text) {
    console.log('Ans: ', text);
}