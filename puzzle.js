"use strict";

const soundsEngine = (function() {
    const hitSound = new Audio('sounds/hitsound.wav');
	const goodSound = new Audio('sounds/goodsound.wav');
	const oofSound = new Audio('sounds/oofsound.wav');

    const hitSounds = [];
    const goodSounds = [];
    const oofSounds = [];

	let soundCounter = 0;

    return {
		initSounds() {
			if (hitSounds.length)
				return;

			for (let i = 0; i < 10; i++) {
				hitSounds.push(hitSound.cloneNode());
				goodSounds.push(goodSound.cloneNode());
				oofSounds.push(oofSound.cloneNode());
			}
		},

		playHitSound() {
			soundCounter++;
			if (soundCounter === 10)
				soundCounter = 0;
			hitSounds[soundCounter].play();
		},

		playGoodSound() {
			soundCounter++;
			if (soundCounter === 10)
				soundCounter = 0;
			goodSounds[soundCounter].play();
		},
		playOofSound() {
			soundCounter++;
			if (soundCounter === 10)
				soundCounter = 0;
			oofSounds[soundCounter].play();
		}
	}
})();

const statsEngine = (function() {
	const stats = {
		moves: 0,
		misses: 0,
		doubles: 0,
		retard: 0,
	}

	return {
	    pull : () => Object.values(stats),

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

const timerEngine = (function() {
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
			if (timerID === null)
                timerID = setInterval(this.tick.bind(this), 1000);
			// this.tick without the .bind(this) also works, idk why tho
		},

		stop() {
			if (timerID !== null) {
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

const puzzleEngine = (function() {
    let image = null;
    let id1 = '';
    let numColsToCut = 1;
    let numRowsToCut = 1;
    let imagePieces = [];
    let diffs = [];

    const processDiffs = () => {
        diffs = [];
        $('#diffSelect').empty();

        const w = image.naturalWidth;
        const h = image.naturalHeight;

        for (let i = 25; i < w; i++) {
            if (w % i !== 0)
                continue;

            for (let j = -1 * Math.floor(i * 0.11); j < i * 0.11; j++) {
                if (h % (i - j) === 0) {
                    const puzzleWidth = i, puzzleHeight = i - j;
                    diffs.push([puzzleWidth, puzzleHeight]);
                    const option = document.createElement('option');
                    option.text = `${w / puzzleWidth}x${h / puzzleHeight}(${puzzleWidth}x${puzzleHeight}px)`;
                    document.getElementById('diffSelect').add(option);
                }
            }
        }

        if (diffs.length === 0)
            alert('No possible square or almost square difficulties possible. Please choose a picture with a common aspect ratio.');
        else
            document.getElementById('loadImageButton').value = 'Loaded!';
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

    const cutImageUp = (widthOfOnePiece, heightOfOnePiece) => {
        for (let y = 0; y < numRowsToCut; y++) {
            for (let x = 0; x < numColsToCut; x++) {
                const canvas = document.createElement('canvas');
                canvas.width = widthOfOnePiece;
                canvas.height = heightOfOnePiece;

                const context = canvas.getContext('2d');
                context.drawImage(image, x * widthOfOnePiece, y * heightOfOnePiece,
                    widthOfOnePiece, heightOfOnePiece, 0, 0, canvas.width, canvas.height);

                imagePieces.push(canvas.toDataURL());
            }
        }
    };

    const fillContainers = (widthOfOnePiece, heightOfOnePiece) => {
        const layer1 = $('#layer1');
        const layer2 = $('#layer2');
        const whitebg = $('#whitebg');

        for (let i = 0; i < numColsToCut * numRowsToCut; i++) {
            if (i % numColsToCut === 0 && i !== 0) {
                layer1.append('<br>');
                layer2.append('<br>');
                whitebg.append('<br>');
            }

            layer1.append(`<img id=${i} src=${imagePieces[i]} draggable="false" alt=""/>`); //add onclick=swap(this.id)
            document.getElementById(`${i}`).addEventListener('mousedown', () => {
                swap(event.target.id);
            }); //instead of this

            layer2.append(`<img id=${i}_x src=https://i.ibb.co/1ZhYj3v/block.png height=${heightOfOnePiece} width=${widthOfOnePiece} draggable="false" style="opacity:0" alt=""/>`);
            whitebg.append(`<img id=${i}_bg src=https://i.imgur.com/j2HZfhe.png height=${heightOfOnePiece} width=${widthOfOnePiece} draggable="false" alt=""/>`);
        }
    };

    const swap = (id2) => {
        if (document.getElementById(id2).src === imagePieces[id2]) {
            soundsEngine.playOofSound();
            statsEngine.update("retard");
            const id2_x = `${id2}_x`;
            document.getElementById(id2_x).style.opacity = '1';
            setTimeout(() => $(`#${id2}_x`).animate({opacity: 0}), 300);
            return;
        }

        soundsEngine.playHitSound();

        if (id1 === '') {
            document.getElementById(id2).style.opacity = '0.7';
            id1 = id2;
            return;

        } else if (id1 !== id2) {
            statsEngine.update("moves");
            const srcpom = document.getElementById(id1).src;
            document.getElementById(id1).src = document.getElementById(id2).src;
            document.getElementById(id2).src = srcpom;

            const src1 = document.getElementById(id1).src;
            const src2 = document.getElementById(id2).src;

            if (src1 === imagePieces[id1] && src2 === imagePieces[id2]) {
                setTimeout(() => {
                    soundsEngine.playGoodSound();
                }, 100);
                soundsEngine.playGoodSound();
                statsEngine.update("doubles");

            } else if (src1 === imagePieces[id1] || src2 === imagePieces[id2]) {
                soundsEngine.playGoodSound();

            } else {
                statsEngine.update("misses");
            }
        }

        document.getElementById(id1).style.opacity = '1';
        id1 = '';

        if (allCorrect())
            setTimeout(alertEndResults, 500);
    };

    const allCorrect = () => {
        for (let i = 0; i < numColsToCut * numRowsToCut; i++) {
            if (document.getElementById(`${i}`).src !== imagePieces[i])
                return false;
        }

        timerEngine.stop();
        return true;
    };

    const alertEndResults = () => {
        const time = timerEngine.getTime();
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const [moves, misses, doubles, retard] = statsEngine.pull();

        if (seconds < 10)
            alert(`Well done!
Time: ${minutes}:0${seconds}
Moves: ${moves}
Misses: ${misses}
Doubles: ${doubles}
Retard: ${retard}`);
        else
            alert(`Well done!
Time: ${minutes}:${seconds}
Moves: ${moves}
Misses: ${misses}
Doubles: ${doubles}
Retard: ${retard}`);
    };

    return {
        initImage() {
            image = new Image();
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = '';
        },

        setImage(file) {
            image.onload = () => URL.revokeObjectURL(image.src);
            image.src = URL.createObjectURL(file);
        },

        loadImage() {
            if (!image.complete)
                window.setTimeout(this.loadImage.bind(puzzleEngine), 100);
            else
                processDiffs();
        },

        generatePuzzles() {
            if (image.src === '') {
                alert('Load an image first!');
                return;
            }

            const containerArray = document.getElementsByClassName('container');
            const containerSize = containerArray.length;
            for (let i = 0; i < containerSize; i++)
                containerArray[i].style.width = `${image.naturalWidth}`;

            document.getElementById('loadImageButton').value = 'Load image';
            imagePieces = [];
            const widthOfOnePiece = diffs[document.getElementById('diffSelect').selectedIndex][0];
            const heightOfOnePiece = diffs[document.getElementById('diffSelect').selectedIndex][1];
            numColsToCut = image.naturalWidth / widthOfOnePiece;
            numRowsToCut = image.naturalHeight / heightOfOnePiece;

            removeAll(widthOfOnePiece, heightOfOnePiece);
            cutImageUp(widthOfOnePiece, heightOfOnePiece);
            fillContainers(widthOfOnePiece, heightOfOnePiece);
        },

        shuffle() {
            if (document.getElementById('layer1').innerHTML === '')
                return;

            for (let i = 0; i < numColsToCut * numRowsToCut; i++) {
                const x = Math.floor((Math.random() * numColsToCut * numRowsToCut));
                const srcpom = document.getElementById(`${i}`).src;
                document.getElementById(`${i}`).src = document.getElementById(`${x}`).src;
                document.getElementById(`${x}`).src = srcpom;
            }

            timerEngine.reset();
            timerEngine.start();
            statsEngine.reset();
        },
    }
})();

window.onload = () => {
    puzzleEngine.initImage();
    soundsEngine.initSounds();

    const input = document.getElementById('linkInput');
    input.addEventListener('change', () => {
        if (input.files && input.files[0])
            puzzleEngine.setImage(input.files[0]);
    });
}