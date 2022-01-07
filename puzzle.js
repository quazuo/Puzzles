const UIEngine = (function () {
    let areStatsVisible = true;

    return {
        uploadImage() {
            this.hideResultsPopup();
            document.getElementById("fileInput").click();
        },

        showChooseDiff() {
            if (!puzzleEngine.isImageLoaded()) return;

            this.hideResultsPopup();
            let popup = $(`#diff-select`);
            popup.css("pointer-events", "all");
            popup.animate({opacity: 1}, 200);
        },

        hideChooseDiff() {
            let popup = $(`#diff-select`);
            popup.css("pointer-events", "none");
            popup.animate({opacity: 0}, 200);
        },

        showResultsPopup() {
            let popup = $(`#results-popup`);
            party.confetti(document.getElementById('results-popup'), {
                count: party.variation.range(50, 70),
                size: party.variation.range(1.0, 2.0),
            });
            popup.css("pointer-events", "all");
            popup.animate({opacity: 1}, 200);
        },

        hideResultsPopup() {
            let popup = $(`#results-popup`);
            popup.css("pointer-events", "none");
            popup.animate({opacity: 0}, 200);
        },

        shuffle() {
            this.hideResultsPopup();
            puzzleEngine.shuffle();
            timerEngine.reset();
            timerEngine.start();
            statsEngine.reset();
        },

        toggleStats() {
            let popup = $(`#stats`);
            popup.animate({opacity: areStatsVisible ? 0 : 1}, 200);
            areStatsVisible = !areStatsVisible;
        },
    }
})();

const soundsEngine = (function () {
    const sounds = {
        hit: {element: new Audio('sounds/hitsound.wav')},
        good: {element: new Audio('sounds/goodsound.wav')},
        retard: {element: new Audio('sounds/oofsound.wav')},
    };

    const VOLUME = 0.15;
    let soundCounter = 0;

    return {
        init() {
            for (let sound of Object.values(sounds)) {
                if (sound.nodes) continue;

                sound.nodes = [];

                for (let i = 0; i < 10; i++) {
                    sound.nodes.push(sound.element.cloneNode());
                    sound.nodes[i].volume = VOLUME;
                }
            }
        },

        play(name) {
            if (!sounds[name]) return;

            sounds[name].nodes[soundCounter].play();

            soundCounter++;
            if (soundCounter === 10)
                soundCounter = 0;
        },

        playDouble() {
            setTimeout(() => this.play("good"), 100);
            this.play("good");
        }
    };
})();

const statsEngine = (function () {
    const stats = {
        moves: 0,
        misses: 0,
        doubles: 0,
        retard: 0,
    }

    return {
        pull: () => Object.values(stats),

        update(stat) {
            if (!Object.keys(stats).includes(stat))
                return;

            stats[stat]++;
            for (let el of document.getElementsByClassName(stat))
                el.innerHTML = stats[stat];
        },

        reset() {
            for (let stat in stats) {
                stats[stat] = 0;
                for (let el of document.getElementsByClassName(stat))
                    el.innerHTML = "0";
            }
        }
    }
})();

const timerEngine = (function () {
    let time = 0;
    let timerID = null;

    return {
        getTime: () => time,

        tick() {
            time++;
            let text = "";
            if (time % 60 < 10)
                text = `${Math.floor(time / 60)}:0${time % 60}`;
            else
                text = `${Math.floor(time / 60)}:${time % 60}`;

            document.getElementById("timer").childNodes[2].textContent = "Time: " + text;
            document.getElementById("final-time").textContent = text;
        },

        start() {
            if (!timerID) timerID = setInterval(this.tick, 1000);
            // might need to bind when code changes, but rn `time` is just a var in the lexical environment
        },

        stop() {
            if (timerID) {
                clearInterval(timerID);
                timerID = null;
            }
        },

        reset() {
            this.stop();
            time = -1;
            this.tick();
        },
    }
})();

const puzzleEngine = (function () {
    let image = null;
    let id1 = null;
    let initialSrcs = [];
    let pieces = [];
    let correctCounter = 0;
    let selectedDiff = {
        cols: 0,
        rows: 0,
    };

    const removeAll = () => {
        $('#layer1 p').remove();
        $('#layer1 img').remove();
        $('#layer1 br').remove();
        $('#layer2 img').remove();
        $('#layer2 br').remove();
        $('#whitebg br').remove();
        $('#whitebg img').remove();
        $('#puzzlebg img').remove();
    };

    const cutImageUp = () => {
        const pieceWidth = image.naturalWidth / selectedDiff.cols;
        const pieceHeight = image.naturalHeight / selectedDiff.rows;

        for (let y = 0; y < selectedDiff.rows; y++) {
            for (let x = 0; x < selectedDiff.cols; x++) {
                const canvas = document.createElement('canvas');
                canvas.width = pieceWidth;
                canvas.height = pieceHeight;

                const context = canvas.getContext('2d');
                context.drawImage(image, x * pieceWidth, y * pieceHeight,
                    pieceWidth, pieceHeight, 0, 0, canvas.width, canvas.height);

                initialSrcs.push(canvas.toDataURL());
            }
        }
    };

    const fillContainers = () => {
        const layer1 = $('#layer1');
        const layer2 = $('#layer2');
        const whitebg = $('#whitebg');

        const pieceWidth = image.naturalWidth / selectedDiff.cols;
        const pieceHeight = image.naturalHeight / selectedDiff.rows;

        for (let i = 0; i < selectedDiff.cols * selectedDiff.rows; i++) {
            if (i % selectedDiff.cols === 0 && i !== 0) {
                layer1.append('<br>');
                layer2.append('<br>');
                whitebg.append('<br>');
            }

            layer1.append(`<img id="${i}" src="${initialSrcs[i]}" onclick="puzzleEngine.swapPuzzles(this.id)" draggable="false" alt=""/>`);
            pieces.push(document.getElementById(`${i}`));
            layer2.append(`<img id="${i}_x" src="https://i.ibb.co/1ZhYj3v/block.png" height=${pieceHeight} width=${pieceWidth} draggable="false" style="opacity:0" alt=""/>`);
            whitebg.append(`<img id="${i}_w" src="https://i.imgur.com/j2HZfhe.png" height=${pieceHeight} width=${pieceWidth} draggable="false" alt=""/>`);
        }
    };

    const swapSources = (id1, id2) => {
        [ pieces[id1].src, pieces[id2].src ] = [ pieces[id2].src, pieces[id1].src ];
    };

    const initiallyCorrectCount = () =>
        pieces.reduce((count, piece, i) => piece.src === initialSrcs[i] ? count + 1 : count, 0);

    return {
        initImage() {
            if (image) return;

            image = new Image();
            image.setAttribute('crossOrigin', 'anonymous');
        },

        isImageLoaded: () => image.src !== "",

        loadImage: (file) => new Promise((resolve, reject) => {
            image.onload = () => {
                URL.revokeObjectURL(image.src);
                resolve(image);
            }
            image.onerror = () => reject(new Error("error while loading image"));
            image.src = URL.createObjectURL(file);
        }),

        selectDiff: (clicked_id) => {
            const diffText = document.getElementById(clicked_id).textContent;
            const [text1, text2] = diffText.split("x");
            selectedDiff = {
                cols: parseInt(text1),
                rows: parseInt(text2),
            };
            UIEngine.hideChooseDiff();
            puzzleEngine.generatePuzzles();
        },

        processDiffs() {
            let diffsCount = 0;
            const diffSelect = $('#diff-select');
            diffSelect.empty();

            const {naturalWidth: w, naturalHeight: h} = image;

            for (let i = 25; i < w; i++) {
                if (w % i !== 0)
                    continue;

                for (let j = -1 * Math.floor(i * 0.11); j < i * 0.11; j++) {
                    if (h % (i - j) === 0) {
                        const pieceWidth = i, pieceHeight = i - j;

                        let desc = `${w / pieceWidth}x${h / pieceHeight} (${pieceWidth}x${pieceHeight}px)`;
                        diffSelect.append(`<a class="diff" id="diff_${diffsCount}" onclick="puzzleEngine.selectDiff(this.id)">${desc}</a>`);
                        diffsCount++;
                    }
                }
            }

            if (diffsCount === 0) {
                image.src = "";
                alert('No possible square or almost square difficulties possible. ' +
                    'Please choose a picture with a common aspect ratio.');
            }
        },

        generatePuzzles() {
            if (!image || image.src === '') {
                alert('Load an image first!');
                return;
            }

            const containers = document.getElementsByClassName('container');
            for (let cont of containers)
                cont.style.width = `${image.naturalWidth}`;

            initialSrcs = [];

            removeAll();
            cutImageUp();
            fillContainers();
        },

        shuffle() {
            if (document.getElementById('layer1').innerHTML === '')
                return;

            for (let i = 0; i < selectedDiff.cols * selectedDiff.rows; i++) {
                const x = Math.floor((Math.random() * selectedDiff.cols * selectedDiff.rows));
                swapSources(`${x}`, `${i}`);
            }

            correctCounter = initiallyCorrectCount();
            // maybe implement a re-shuffle if too many are correct initially? idk
        },

        swapPuzzles: (id2) => {
            if (pieces[id2].src === initialSrcs[id2]) {
                soundsEngine.play("retard");
                statsEngine.update("retard");
                document.getElementById(`${id2}_x`).style.opacity = '1';
                setTimeout(() => $(`#${id2}_x`).animate({opacity: 0}), 300);
                return;
            }

            soundsEngine.play("hit");

            if (id1 === null) {
                pieces[id2].style.opacity = '0.7';
                id1 = id2;
                return;

            } else if (id1 !== id2) {
                statsEngine.update("moves");
                swapSources(id1, id2);

                const src1 = pieces[id1].src;
                const src2 = pieces[id2].src;

                if (src1 === initialSrcs[id1] && src2 === initialSrcs[id2]) {
                    correctCounter += 2;
                    soundsEngine.playDouble();
                    statsEngine.update("doubles");

                } else if (src1 === initialSrcs[id1] || src2 === initialSrcs[id2]) {
                    correctCounter++;
                    soundsEngine.play("good");

                } else {
                    statsEngine.update("misses");
                }
            }

            pieces[id1].style.opacity = '1';
            id1 = null;

            if (correctCounter === selectedDiff.cols * selectedDiff.rows) { // puzzle is solved
                timerEngine.stop();
                setTimeout(UIEngine.showResultsPopup, 500);
            }
        },
    }
})();

window.onbeforeunload = () => "Are you sure you want to close the window?";

window.onload = () => {
    puzzleEngine.initImage();
    soundsEngine.init();

    const input = document.getElementById('fileInput');
    input.addEventListener('change', () => {
        if (input.files && input.files[0])
            puzzleEngine.loadImage(input.files[0])
                .then(puzzleEngine.processDiffs, error => alert(error.message));
    });
}