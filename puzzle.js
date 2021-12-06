"use strict";

const soundsEngine = {
    hitSound: new Audio('sounds/hitsound.wav'),
    goodSound: new Audio('sounds/goodsound.wav'),
    oofSound: new Audio('sounds/oofsound.wav'),

    hitSounds: [],
    goodSounds: [],
    oofSounds: [],

    initSounds() {
        for (let i = 0; i < 10; i++) {
            this.hitSounds.push(this.hitSound.cloneNode());
            this.goodSounds.push(this.goodSound.cloneNode());
            this.oofSounds.push(this.oofSound.cloneNode());
        }
    },

    soundCounter: 0,
    playHitSound() {
        this.soundCounter++;
        if (this.soundCounter === 10)
            this.soundCounter = 0;
        this.hitSounds[this.soundCounter].play();
    },
    playGoodSound() {
        this.soundCounter++;
        if (this.soundCounter === 10)
            this.soundCounter = 0;
        this.goodSounds[this.soundCounter].play();
    },
    playOofSound() {
        this.soundCounter++;
        if (this.soundCounter === 10)
            this.soundCounter = 0;
        this.oofSounds[this.soundCounter].play();
    }
}

const statsEngine = {
    moves: 0,
    misses: 0,
    doubles: 0,
    retard: 0,

    update(stat) {
        if (stat !== "moves" && stat !== "misses" && stat !== "doubles" && stat !== "retard")
            return;

        this[stat]++;
        document.getElementById(stat).innerHTML = this[stat];
    },

    reset() {
        this.moves = 0;
        this.misses = 0;
        this.doubles = 0;
        this.retard = 0;

        document.getElementById('moves').innerHTML = this.moves;
        document.getElementById('misses').innerHTML = this.misses;
        document.getElementById('doubles').innerHTML = this.doubles;
        document.getElementById('retard').innerHTML = this.retard;
    }
}

const timerEngine = {
    time: 0,
    timerID: -1,

    tick() {
        this.time++;
        if (this.time % 60 < 10)
            document.getElementById("timer").innerHTML = `${Math.floor(this.time / 60)}:0${this.time % 60}`;
        else
            document.getElementById("timer").innerHTML = `${Math.floor(this.time / 60)}:${this.time % 60}`;
    },

    start() {
        if (this.timerID === -1)
            this.timerID = setInterval(this.tick.bind(timerEngine), 1000);
    },

    stop() {
        if (this.timerID !== -1) {
            clearInterval(this.timerID);
            this.timerID = -1;
        }
    },

    reset() {
        this.stop();
        this.time = -1;
        this.tick();
    }
}

const puzzleEngine = {
    image: null,
    id1: '',
    numColsToCut: 1,
    numRowsToCut: 1,
    imagePieces: [],
    diffs: [],

    initImage() {
        this.image = new Image();
        this.image.setAttribute('crossOrigin', 'anonymous');
        this.image.src = '';
    },

    loadImage() {
        if (!this.image.complete)
            window.setTimeout(this.loadImage.bind(puzzleEngine), 100);
        else
            this.processDiffs();
    },

    processDiffs() {
        this.diffs = [];
        $('#diffSelect').empty();

        const w = this.image.naturalWidth;
        const h = this.image.naturalHeight;

        for (let i = 25; i < w; i++) {
            if (w % i !== 0)
                continue;

            for (let j = -1 * Math.floor(i * 0.11); j < i * 0.11; j++) {
                if (h % (i - j) === 0) {
                    const puzzleWidth = i, puzzleHeight = i - j;
                    this.diffs.push([puzzleWidth, puzzleHeight]);
                    const option = document.createElement('option');
                    option.text = `${w / puzzleWidth}x${h / puzzleHeight}(${puzzleWidth}x${puzzleHeight}px)`;
                    document.getElementById('diffSelect').add(option);
                }
            }
        }

        if (this.length === 0)
            alert('No possible square or almost square difficulties possible. Please choose a picture with a common aspect ratio.');
        else
            document.getElementById('loadImageButton').value = 'Loaded!';
    },

    removeAll() {
        $('#layer1 p').remove();
        $('#layer1 img').remove();
        $('#layer1 br').remove();
        $('#layer2 img').remove();
        $('#layer2 br').remove();
        $('#whitebg br').remove();
        $('#whitebg img').remove();
        $('#puzzlebg img').remove();
    },

    cutImageUp(widthOfOnePiece, heightOfOnePiece) {
        for (let y = 0; y < this.numRowsToCut; y++) {
            for (let x = 0; x < this.numColsToCut; x++) {
                const canvas = document.createElement('canvas');
                canvas.width = widthOfOnePiece;
                canvas.height = heightOfOnePiece;
                const context = canvas.getContext('2d');
                context.drawImage(this.image, x * widthOfOnePiece, y * heightOfOnePiece,
                    widthOfOnePiece, heightOfOnePiece, 0, 0, canvas.width, canvas.height);
                this.imagePieces.push(canvas.toDataURL());
            }
        }
    },

    fillContainers(widthOfOnePiece, heightOfOnePiece) {
        const layer1 = $('#layer1');
        const layer2 = $('#layer2');
        const whitebg = $('#whitebg');

        for (let i = 0; i < this.numColsToCut * this.numRowsToCut; i++) {
            if (i % this.numColsToCut === 0 && i !== 0) {
                layer1.append('<br>');
                layer2.append('<br>');
                whitebg.append('<br>');
            }

            layer1.append(`<img id=${i} src=${this.imagePieces[i]} draggable="false" alt=""/>`); //add onclick=swap(this.id)
            document.getElementById(i.toString()).addEventListener('mousedown', () => {
                this.swap(event.target.id);
            }); //instead of this

            layer2.append(`<img id=${i}_x src=https://i.ibb.co/1ZhYj3v/block.png height=${heightOfOnePiece} width=${widthOfOnePiece} draggable="false" style="opacity:0" alt=""/>`);
            whitebg.append(`<img id=${i}_bg src=https://i.imgur.com/j2HZfhe.png height=${heightOfOnePiece} width=${widthOfOnePiece} draggable="false" alt=""/>`);
        }
    },

    generatePuzzles() {
        if (this.image.src === '') {
            alert('Load an image first!');
            return;
        }

        const containerArray = document.getElementsByClassName('container');
        const containerSize = containerArray.length;
        for (let i = 0; i < containerSize; i++)
            containerArray[i].style.width = `${this.image.naturalWidth}`;

        document.getElementById('loadImageButton').value = 'Load image';
        this.imagePieces = [];
        const widthOfOnePiece = this.diffs[document.getElementById('diffSelect').selectedIndex][0];
        const heightOfOnePiece = this.diffs[document.getElementById('diffSelect').selectedIndex][1];
        this.numColsToCut = this.image.naturalWidth / widthOfOnePiece;
        this.numRowsToCut = this.image.naturalHeight / heightOfOnePiece;

        this.removeAll(widthOfOnePiece, heightOfOnePiece);
        this.cutImageUp(widthOfOnePiece, heightOfOnePiece);
        this.fillContainers(widthOfOnePiece, heightOfOnePiece);
    },

    swap(id2) {
        if (document.getElementById(id2).src === this.imagePieces[id2]) {
            soundsEngine.playOofSound();
            statsEngine.update("retard");
            const id2_x = `${id2}_x`;
            document.getElementById(id2_x).style.opacity = '1';
            setTimeout(() => $(`#${id2}_x`).animate({opacity: 0}), 300);
            return;
        }
        soundsEngine.playHitSound();
        if (this.id1 === '') {
            document.getElementById(id2).style.opacity = '0.7';
            this.id1 = id2;
            return;
        } else if (this.id1 !== id2) {
            statsEngine.update("moves");
            const srcpom = document.getElementById(this.id1).src;
            document.getElementById(this.id1).src = document.getElementById(id2).src;
            document.getElementById(id2).src = srcpom;

            const src1 = document.getElementById(this.id1).src;
            const src2 = document.getElementById(id2).src;

            if (src1 === this.imagePieces[this.id1] && src2 === this.imagePieces[id2]) {
                setTimeout(() => { soundsEngine.playGoodSound(); }, 100);
                soundsEngine.playGoodSound();
                statsEngine.update("doubles");

            } else if (src1 === this.imagePieces[this.id1] || src2 === this.imagePieces[id2]) {
                soundsEngine.playGoodSound();

            } else {
                statsEngine.update("misses");
            }

            document.getElementById(this.id1).style.opacity = '1';
            this.id1 = '';

        } else {
            document.getElementById(this.id1).style.opacity = '1';
            this.id1 = '';
        }
        if (this.allCorrect())
            setTimeout(this.alertEndResults, 500);
    },

    shuffle() {
        if (document.getElementById('layer1').innerHTML === '')
            return;

        for (let i = 0; i < this.numColsToCut * this.numRowsToCut; i++) {
            const x = Math.floor((Math.random() * this.numColsToCut * this.numRowsToCut));
            const srcpom = document.getElementById(`${i}`).src;
            document.getElementById(`${i}`).src = document.getElementById(`${x}`).src;
            document.getElementById(`${x}`).src = srcpom;
        }

        timerEngine.reset();
        timerEngine.start();
        statsEngine.reset();
    },

    allCorrect() {
        for (let i = 0; i < this.numColsToCut * this.numRowsToCut; i++) {
            if (document.getElementById(`${i}`).src !== this.imagePieces[i])
                return false;
        }

        timerEngine.stop();
        return true;
    },

    alertEndResults() {
        if (timerEngine.time % 60 < 10)
            alert(`Well done!
Time: ${Math.floor(timerEngine.time / 60)}:0${timerEngine.time % 60}
Moves: ${statsEngine.moves}
Misses: ${statsEngine.misses}
Doubles: ${statsEngine.doubles}
Retard: ${statsEngine.retard}`);
        else
            alert(`Well done!
Time: ${Math.floor(timerEngine.time / 60)}:${timerEngine.time % 60}
Moves: ${statsEngine.moves}
Misses: ${statsEngine.misses}
Doubles: ${statsEngine.doubles}
Retard: ${statsEngine.retard}`);
    }
}

window.onload = () => {
    puzzleEngine.initImage();
    soundsEngine.initSounds();

    const input = document.getElementById('linkInput');
    input.addEventListener('change', () => {
        if (input.files && input.files[0]) {
            puzzleEngine.image.onload = () => URL.revokeObjectURL(puzzleEngine.image.src);
            puzzleEngine.image.src =
                URL.createObjectURL(input.files[0]);
        }
    });
}