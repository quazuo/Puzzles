"use strict";

const soundsEngine = (function () {
    const sounds = {
        hit: {element: new Audio('sounds/hitsound.wav')},
        good: {element: new Audio('sounds/goodsound.wav')},
        retard: {element: new Audio('sounds/oofsound.wav')},
    };

    const VOLUME = 0.1;
    let soundCounter = 0;

    return {
        init() {
            for (let sound of Object.values(sounds)) {
                if (sound.arr) continue;

                sound.arr = [];

                for (let i = 0; i < 10; i++) {
                    sound.arr.push(sound.element.cloneNode());
                    sound.arr[i].volume = VOLUME;
                }
            }
        },

        play(name) {
            if (!sounds[name]) return;

            sounds[name].arr[soundCounter].play();

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
            document.getElementById(stat).innerHTML = stats[stat];
        },

        reset() {
            for (let stat in stats) {
                stats[stat] = 0;
                document.getElementById(stat).innerHTML = stats[stat];
            }
        }
    }
})();

const timerEngine = (function () {
    let time = 0;
    let timerID = null;

    return {
        getTime() {
            return time;
        },

        tick() {
            time++;
            if (time % 60 < 10)
                document.getElementById("timer").innerHTML =
                    `${Math.floor(time / 60)}:0${time % 60}`;
            else
                document.getElementById("timer").innerHTML =
                    `${Math.floor(time / 60)}:${time % 60}`;
        },

        start() {
            if (!timerID)
                timerID = setInterval(this.tick.bind(this), 1000);
            // this.tick without the .bind(this) also works, idk why tho
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
        }
    }
})();

const puzzleEngine = (function () {
    let image = null;
    let id1 = null;
    let numColsToCut = 1;
    let numRowsToCut = 1;
    let imagePieces = [];
    let diffs = [];
    let correctCounter = 0;

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

    const cutImageUp = (pieceWidth, pieceHeight) => {
        for (let y = 0; y < numRowsToCut; y++) {
            for (let x = 0; x < numColsToCut; x++) {
                const canvas = document.createElement('canvas');
                canvas.width = pieceWidth;
                canvas.height = pieceHeight;

                const context = canvas.getContext('2d');
                context.drawImage(image, x * pieceWidth, y * pieceHeight,
                    pieceWidth, pieceHeight, 0, 0, canvas.width, canvas.height);

                imagePieces.push(canvas.toDataURL());
            }
        }
    };

    const fillContainers = (pieceWidth, pieceHeight) => {
        const layer1 = $('#layer1');
        const layer2 = $('#layer2');
        const whitebg = $('#whitebg');

        for (let i = 0; i < numColsToCut * numRowsToCut; i++) {
            if (i % numColsToCut === 0 && i !== 0) {
                layer1.append('<br>');
                layer2.append('<br>');
                whitebg.append('<br>');
            }

            layer1.append(`<img id=${i} src=${imagePieces[i]} draggable="false" alt=""/>`); //add onclick=swapPuzzles(this.id)
            document.getElementById(`${i}`).addEventListener('mousedown', () => {
                swapPuzzles(event.target.id);
            }); //instead of this

            layer2.append(`<img id=${i}_x src=https://i.ibb.co/1ZhYj3v/block.png height=${pieceHeight} width=${pieceWidth} draggable="false" style="opacity:0" alt=""/>`);
            whitebg.append(`<img id=${i}_bg src=https://i.imgur.com/j2HZfhe.png height=${pieceHeight} width=${pieceWidth} draggable="false" alt=""/>`);
        }
    };

    const swapSources = (id1, id2) => {
        const temp = document.getElementById(id1).src;
        document.getElementById(id1).src = document.getElementById(id2).src;
        document.getElementById(id2).src = temp;
    }

    const swapPuzzles = (id2) => {
        if (document.getElementById(id2).src === imagePieces[id2]) {
            soundsEngine.play("retard");
            statsEngine.update("retard");
            document.getElementById(`${id2}_x`).style.opacity = '1';
            setTimeout(() => $(`#${id2}_x`).animate({opacity: 0}), 300);
            return;
        }

        soundsEngine.play("hit");

        if (!id1) {
            document.getElementById(id2).style.opacity = '0.7';
            id1 = id2;
            return;

        } else if (id1 !== id2) {
            statsEngine.update("moves");
            swapSources(id1, id2);

            const src1 = document.getElementById(id1).src;
            const src2 = document.getElementById(id2).src;

            if (src1 === imagePieces[id1] && src2 === imagePieces[id2]) {
                correctCounter += 2;
                soundsEngine.playDouble();
                statsEngine.update("doubles");

            } else if (src1 === imagePieces[id1] || src2 === imagePieces[id2]) {
                correctCounter++;
                soundsEngine.play("good");

            } else {
                statsEngine.update("misses");
            }
        }

        document.getElementById(id1).style.opacity = '1';
        id1 = null;

        if (correctCounter === numColsToCut * numRowsToCut) // puzzle is solved
            setTimeout(alertEndResults, 500);
    };

    const initiallyCorrectCount = () => {
        let counter = 0;

        for (let i = 0; i < numColsToCut * numRowsToCut; i++) {
            if (document.getElementById(`${i}`).src === imagePieces[i])
                counter++;
        }

        return counter;
    }

    const alertEndResults = () => {
        const time = timerEngine.getTime();
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const [moves, misses, doubles, retard] = statsEngine.pull();

        if (seconds < 10) {
            alert(`Well done!
Time: ${minutes}:0${seconds}
Moves: ${moves}
Misses: ${misses}
Doubles: ${doubles}
Retard: ${retard}`);
        } else {
            alert(`Well done!
Time: ${minutes}:${seconds}
Moves: ${moves}
Misses: ${misses}
Doubles: ${doubles}
Retard: ${retard}`);
        }
    };

    return {
        initImage() {
            if (image) return;

            image = new Image();
            image.setAttribute('crossOrigin', 'anonymous');
        },

        loadImage: (file) => new Promise((resolve, reject) => {
            image.onload = () => {
                URL.revokeObjectURL(image.src);
                resolve(image);
            }
            image.onerror = () => reject(new Error("error while loading image"));
            image.src = URL.createObjectURL(file);
        }),

        processDiffs() {
            diffs = [];
            $('#diffSelect').empty();

            const {naturalWidth: w, naturalHeight: h} = image;

            for (let i = 25; i < w; i++) {
                if (w % i !== 0)
                    continue;

                for (let j = -1 * Math.floor(i * 0.11); j < i * 0.11; j++) {
                    if (h % (i - j) === 0) {
                        const pieceWidth = i, pieceHeight = i - j;
                        diffs.push([pieceWidth, pieceHeight]);
                        const option = document.createElement('option');
                        option.text = `${w / pieceWidth}x${h / pieceHeight}(${pieceWidth}x${pieceHeight}px)`;
                        document.getElementById('diffSelect').add(option);
                    }
                }
            }

            if (diffs.length === 0)
                alert('No possible square or almost square difficulties possible. ' +
                    'Please choose a picture with a common aspect ratio.');
        },

        generatePuzzles() {
            if (!image || image.src === '') {
                alert('Load an image first!');
                return;
            }

            const containersArray = document.getElementsByClassName('container');
            const containersCount = containersArray.length;
            for (let i = 0; i < containersCount; i++)
                containersArray[i].style.width = `${image.naturalWidth}`;

            imagePieces = [];
            const [pieceWidth, pieceHeight] = diffs[document.getElementById('diffSelect').selectedIndex];
            numColsToCut = image.naturalWidth / pieceWidth;
            numRowsToCut = image.naturalHeight / pieceHeight;

            removeAll();
            cutImageUp(pieceWidth, pieceHeight);
            fillContainers(pieceWidth, pieceHeight);
        },

        shuffle() {
            if (document.getElementById('layer1').innerHTML === '')
                return;

            for (let i = 0; i < numColsToCut * numRowsToCut; i++) {
                const x = Math.floor((Math.random() * numColsToCut * numRowsToCut));
                swapSources(`${x}`, `${i}`);
            }

            correctCounter = initiallyCorrectCount();
            // maybe implement a re-shuffle if too many are correct initially? idk
            timerEngine.reset();
            timerEngine.start();
            statsEngine.reset();
        },
    }
})();

window.onload = () => {
    puzzleEngine.initImage();
    soundsEngine.init();

    const input = document.getElementById('linkInput');
    input.addEventListener('change', () => {
        if (input.files && input.files[0])
            puzzleEngine.loadImage(input.files[0])
                .then(puzzleEngine.processDiffs, error => alert(error.message));
    });
}