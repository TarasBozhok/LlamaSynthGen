import path from 'node:path';
import { getLlama } from 'node-llama-cpp';

var modelPath = path.join(process.env.MODEL_PATH, process.env.MODEL_NAME);

var { sequence, model } = await Promise.resolve()
    .then(getLlama)
    .then((llama) => llama.loadModel({ modelPath }))
    .then((model) => ({ context: model.createContext(), model }))
    .then(({ context, model }) => {
        return {
            sequence: context.getSequence(),
            model
        }
    });


var text = '';
var tokens = model.tokenize(text);

for (var generatedToken of sequence.evaluate(tokens)) {
    console.log('raw: ', generatedToken);

    console.log('detokenized: ', model.detokenize(generatedToken));

    var concatenated = Array.isArray(concatenated) ? concatenated.push(generatedToken) : [generatedToken];
}

console.log('finish: ', 'raw: ', generatedToken.join(''));
console.log('finish: ', 'detokenized: ', model.detokenize(generatedToken.join('')));