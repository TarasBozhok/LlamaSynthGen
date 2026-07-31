import readline from 'node:readline';

const chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function spinnerFunction(loadingText = 'Loading', currentChar = 0) {

    if (this.complete) return undefined;

    this.timeoutId = setTimeout(() => {
        process.stdout.write(`\r${chars[currentChar]} ${loadingText} ${chars[currentChar]} `)
        currentChar = (currentChar + 1) % chars.length;
        spinner(loadingText, currentChar);
    }, 100);
}

var innerState = { complete: false };
var spinner = spinnerFunction.bind(innerState);

export default {
    start(loadingText) {
        spinner(loadingText);
    },
    stop() {
        clearTimeout(innerState.timeoutId);
        innerState.complete = true;
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 1);
    }
}
