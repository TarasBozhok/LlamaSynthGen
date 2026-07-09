import readline from 'node:readline';
import { styleText } from 'node:util';

var userInputArgs = [
    {
        question: `${styleText(['bold', 'grey'], 'Number of actors?')} Usually 3.`,
        constant: 'ACTORS_NUM',
        validator: (answer) => /^\d+$/g.test(answer) && !Number.isNaN(Number(answer)),
        formatter: (val) => Math.min(parseInt(val), Number.MAX_SAFE_INTEGER),
        default: 3
    },
    {
        question: `${styleText(['bold', 'grey'], 'Number of rounds?')} 1 round counts when every actor spoke. Usually 100.`,
        constant: 'ROUNDS_NUM',
        validator: (answer) => /^\d+$/g.test(answer) && !Number.isNaN(Number(answer)),
        formatter: (val) => Math.min(parseInt(val), Number.MAX_SAFE_INTEGER),
        default: 100,
    },
    {
        question: `${styleText(['bold', 'grey'], 'Enable debugging?')}`,
        constant: 'DEBUG_MODE',
        validator: () => true,
        formatter: (val) => val && [true, 'true', 'debug', '+', 1, '1'].includes(val) ? true : false,
        default: false,
    }
];

async function* getUserInputIterator() {
    var currIndex = 0;
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while (currIndex < userInputArgs.length) {
        yield new Promise((res) => {
            var currentUserInputArg = userInputArgs[currIndex];
            rl.question(currentUserInputArg.question + '\n', (ans) => {
                if (currentUserInputArg.validator(ans)) {
                    currIndex++;
                    res([currentUserInputArg, ans]);
                } else {
                    res()
                }
            });
        });
    }
    rl.close();

    return;
}

export default async function getUserInput(...constNames) {
    var userInputIterator = getUserInputIterator(userInputArgs.filter((userInputArg) => constNames.includes(userInputArg.constant)));
    for await (var userAnswer of userInputIterator) {
        if (!userAnswer) continue; // Not valid, re-ask

        var [currQuestion, ans] = userAnswer;
        globalThis[currQuestion.constant] = ans ? currQuestion.formatter(ans) : currQuestion.default;

    }
}
