const EXAMPLES = 10;

async function collectSounds(recognizer, name, count) {
    for (let i = 0; i < count; i++) {
        console.log(`Say ${name}`);
        await recognizer.collectExample(name);
    }
}

function download(transferRecognizer) {
    const artifacts = transferRecognizer.serializeExamples();
    const anchor = document.createElement('a');
    anchor.download = `voyager.bin`;
    anchor.href = window.URL.createObjectURL(
        new Blob([artifacts], {
            type: 'application/octet-stream'
        }));
    anchor.click();
};

async function createAndTrainModel(transferRecognizer) {
    await collectSounds(transferRecognizer, "Yo Asim", EXAMPLES);
    await collectSounds(transferRecognizer, "Ok Google", EXAMPLES);
    await collectSounds(transferRecognizer, "Hey Cortana", EXAMPLES);
    await collectSounds(transferRecognizer, "Hey Siri", EXAMPLES);
    await collectSounds(transferRecognizer, "Alexa", EXAMPLES);
    await collectSounds(transferRecognizer, "_background_noise_", EXAMPLES);
    console.log("Finished...");
    console.log(transferRecognizer.countExamples());

    console.log("Training...");
    await transferRecognizer.train({
        epochs: 25,
        callback: {
            onEpochEnd: async (epoch, logs) => {
                console.log(`Epoch ${epoch}: loss=${logs.loss}, accuracy=${logs.acc}`);
            }
        }
    });
}

function showBubble() {
    const bubble = document.getElementById("bubble");
    bubble.style.display = "block";
    setTimeout(() => {
        bubble.style.display = "none";
    }, 2000)
}

async function loadModel(transferRecognizer) {
    const response = await fetch('http://127.0.0.1:5500/voyager.bin');
    const buffer = await response.arrayBuffer();
    transferRecognizer.loadExamples(buffer, false);
    await transferRecognizer.train({
        epochs: 25,
        callback: {
            onEpochEnd: async (epoch, logs) => {
                console.log(`Epoch ${epoch}: loss=${logs.loss}, accuracy=${logs.acc}`);
            }
        }
    });
}

/*
speech-commands.min.js:17 Uncaught (in promise) Error: Mismatch between the last dimension of model's output shape (20) and number of words (2).
    at l.<anonymous> (speech-commands.min.js:17)
    at speech-commands.min.js:17
    at Object.next (speech-commands.min.js:17)
    at s (speech-commands.min.js:17)
*/


async function app() {

    let baseRecognizer = speechCommands.create('BROWSER_FFT');
    console.log("Model loading...");
    await baseRecognizer.ensureModelLoaded();
    console.log("Creating transfer recognizer...");
    const transferRecognizer = baseRecognizer.createTransfer('yoasim');

    // console.log("Training...");
    // await createAndTrainModel(transferRecognizer);
    // console.log("Downloading...");
    // download(transferRecognizer)


    await loadModel(transferRecognizer);




    console.log("Listening...");
    await transferRecognizer.listen(result => {
        console.log("-----------------------------------");
        const words = transferRecognizer.wordLabels();
        // Turn scores into a list of (score,word) pairs.
        scores = Array.from(result.scores).map((s, i) => ({
            score: s,
            word: words[i]
        }));
        // Find the most probable word.
        scores.sort((s1, s2) => s2.score - s1.score);
        console.log(`Score for word '${scores[0].word}' = ${scores[0].score}`);

        if (scores[0].word == "Yo Asim") {
            showBubble()
        }

        console.log("-----------------------------------");
    }, {
        probabilityThreshold: 0.75
    });

    setTimeout(() => transferRecognizer.stopListening(), 600e3);

}

app()

// TO FIX IN CODE
// for (let i = 0; i < words.>>length<<; ++i) {