import readline from 'node:readline';
import { stdin, stdout} from 'node:process';
import { styleText } from 'node:util';

var userInputArgs = [
    {
        question: 'Number of actors?',
        description: ' Usually 3.',
        constant: 'ACTORS_NUM',
        validator: (answer) => /^\d+$/g.test(answer) && !Number.isNaN(Number(answer)),
        formatter: (val) => Math.min(parseInt(val), Number.MAX_SAFE_INTEGER),
        default: 3
    },
    {
        question: 'Number of rounds?',
        description: ' 1 round counts when every actor spoke. Usually 100.',
        constant: 'ROUNDS_NUM',
        validator: (answer) => /^\d+$/g.test(answer) && !Number.isNaN(Number(answer)),
        formatter: (val) => Math.min(parseInt(val), Number.MAX_SAFE_INTEGER),
        default: 100,
    },
    {
        question: 'Enable debugging?',
        description: '',
        constant: 'DEBUG_MODE',
        validator: () => true,
        formatter: (val) => val && [true, 'true', 'debug', '+', 1, '1'].includes(val) ? true : false,
        default: false,
    }
];

async function* getUserInputIterator() {
    var currIndex = 0;
    var rl = readline.createInterface({
        input: stdin,
        output: stdout
    });

    while (currIndex < userInputArgs.length) {
        yield new Promise((res) => {
            var currentUserInputArg = userInputArgs[currIndex];
            var question = styleText(['bold', 'grey'], currentUserInputArg.question);
            rl.question(question + currentUserInputArg.description + '\n', (ans) => {
                if (currentUserInputArg.validator(ans)) {
                    var result = ans ? currentUserInputArg.formatter(ans) : currentUserInputArg.default;
                    currIndex++;
                    res([currentUserInputArg, result]);
                    clearLineTerminal(2);
                    console.log(styleText(['bold', 'grey'],currentUserInputArg.question.replace('?', `: ${result}`)));
                } else {
                    res()
                }
            });
        });
    }
    console.log('\n');
    rl.close();

    return;
}

function clearLineTerminal(numLines=1) {
    readline.moveCursor(process.stdout, 0, -numLines);
    readline.clearLine(process.stdout, 1);
}

export default async function getUserInput(...constNames) {
    var returnObj = {};
    var userInputIterator = getUserInputIterator(userInputArgs.filter((userInputArg) => constNames.includes(userInputArg.constant)));
    for await (var userAnswer of userInputIterator) {
        if (!userAnswer) continue; // Not valid, re-ask

        var [currQuestion, result] = userAnswer;
        returnObj[currQuestion.constant] = result;
    }

    return returnObj;
}
