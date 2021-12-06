"use strict";
// sounds
const hitSound = new Audio('sounds/hitsound.wav');
const goodSound = new Audio('sounds/goodsound.wav');
const oofSound = new Audio('sounds/oofsound.wav');

const hitSounds = [];
const goodSounds = [];
const oofSounds = [];

for (let i = 0; i < 10; i++){
	hitSounds.push(hitSound.cloneNode());
	goodSounds.push(goodSound.cloneNode());
	oofSounds.push(oofSound.cloneNode());
}

// variables
const image = new Image();
image.setAttribute('crossOrigin', 'anonymous');
image.src = '';

let id1 = '';
const stats = {
	moves  : 0,
	misses : 0,
	doubles: 0,
	retard : 0,
};

let numColsToCut = 1;
let numRowsToCut = 1;
let imagePieces = [];
let diffs = [];

// functions
function loadImage(){
	diffs = [];
	image.src = document.getElementById('imageLinkInput').value;
	waitImageComplete();
}
function waitImageComplete(){
	if(!image.complete) 
		window.setTimeout(waitImageComplete, 100);
	else 
		processDiffs();
}
function processDiffs(){
	let diffLength = document.getElementById('diffSelect').length;
	for (let i = 0; i < diffLength; i++) 
		document.getElementById('diffSelect').remove();
	let natWidth = image.naturalWidth;
	let natHeight = image.naturalHeight;
	for (let i = 25; i < natWidth; i++){
		if (natWidth % i !== 0)
			continue;
		for (let j = -1 * Math.floor(i * 0.11); j < i * 0.11; j++){
			if (natHeight % (i - j) === 0){
				let puzzleWidth = i, puzzleHeight = i - j;
				diffs.push([puzzleWidth, puzzleHeight]);
				let option = document.createElement('option');
				option.text = `${natWidth/puzzleWidth}x${natHeight/puzzleHeight}(${puzzleWidth}x${puzzleHeight}px)`;
				document.getElementById('diffSelect').add(option);
			}
		}
	}
	if(diffs.length === 0)
		alert('No possible square or almost square difficulties possible. Please choose a picture with a common aspect ratio.');
	else 
		document.getElementById('loadImageButton').value = 'Loaded!';
}
function removeAll(){
	$('#layer1 p').remove();
	$('#layer1 img').remove();
	$('#layer1 br').remove();
	$('#layer2 img').remove();
	$('#layer2 br').remove();
	$('#whitebg br').remove();
	$('#whitebg img').remove();
	$('#puzzlebg img').remove();
}
function cutImageUp(widthOfOnePiece, heightOfOnePiece){
    for (let y = 0; y < numRowsToCut; y++) {
        for (let x = 0; x < numColsToCut; x++) {
            let canvas = document.createElement('canvas');
            canvas.width = widthOfOnePiece;
            canvas.height = heightOfOnePiece;
            let context = canvas.getContext('2d');
            context.drawImage(image, x * widthOfOnePiece, y * heightOfOnePiece,
				widthOfOnePiece, heightOfOnePiece, 0, 0, canvas.width, canvas.height);
            imagePieces.push(canvas.toDataURL());		
        }
    }	
} 
function fillContainers(widthOfOnePiece, heightOfOnePiece){
	let layer1 = $('#layer1');
	let layer2 = $('#layer2');
	let whitebg = $('#whitebg');
	for (let i = 0; i < numColsToCut * numRowsToCut; i++){
		if (i % numColsToCut === 0 && i !== 0){
			layer1.append('<br>');
			layer2.append('<br>');
			whitebg.append('<br>');
		}
		layer1.append(`<img id=${i} src=${imagePieces[i]} draggable="false" alt=""/>`); //add onclick=swap(this.id)
		document.getElementById(i.toString()).addEventListener('mousedown', e => {swap(event.target.id);}); //instead of this
		layer2.append(`<img id=${i}_x src=https://i.ibb.co/1ZhYj3v/block.png height=${heightOfOnePiece} width=${widthOfOnePiece} draggable="false" style="opacity:0" alt=""/>`);
		whitebg.append(`<img id=${i}_bg src=https://i.imgur.com/j2HZfhe.png height=${heightOfOnePiece} width=${widthOfOnePiece} draggable="false" alt=""/>`);
	}
}
function generatePuzzles(){
	if (image.src === ''){
		alert('Load an image first!');
		return;
	}
	let containerArray = document.getElementsByClassName('container');
	let containerWidth = image.naturalWidth;
	let containerSize = containerArray.length;
	for (let i = 0; i < containerSize; i++) 
		containerArray[i].style.width = containerWidth.toString();
	document.getElementById('loadImageButton').value = 'Load image';
	imagePieces = [];
	let widthOfOnePiece = diffs[document.getElementById('diffSelect').selectedIndex][0];
	let heightOfOnePiece = diffs[document.getElementById('diffSelect').selectedIndex][1];
	numColsToCut = image.naturalWidth/widthOfOnePiece;
	numRowsToCut = image.naturalHeight/heightOfOnePiece;
	
	removeAll(widthOfOnePiece, heightOfOnePiece);
	cutImageUp(widthOfOnePiece, heightOfOnePiece);
	fillContainers(widthOfOnePiece, heightOfOnePiece);
}

let c = 0;
function playHitSound(){
	c++;
	if (c === 10)
		c = 0;
	hitSounds[c].play();
}
function playGoodSound(){
	c++;
	if (c === 10)
		c = 0;
	goodSounds[c].play();
}
function playOofSound(){
	c++;
	if (c === 10)
		c = 0;
	oofSounds[c].play();
}

function swap(id2){
	if (document.getElementById(id2).src === imagePieces[id2]){
		playOofSound();
		stats.retard++;
		document.getElementById('retard').innerHTML = stats.retard;
		let id2_x = `${id2}_x`;
		document.getElementById(id2_x).style.opacity = '1';
		setTimeout(function(){$(`#${id2}_x`).animate({opacity: 0})}, 300);
		return;
	}
	playHitSound();
	if (id1 === ''){
		document.getElementById(id2).style.opacity = 0.7;
		id1 = id2;
		return;
	}
	else if (id1 !== id2){
		stats.moves++;
		document.getElementById('moves').innerHTML = stats.moves;
		let srcpom = document.getElementById(id1).src;
		document.getElementById(id1).src = document.getElementById(id2).src;
		document.getElementById(id2).src = srcpom;
		
		let src1 = document.getElementById(id1).src;
		let src2 = document.getElementById(id2).src;
		if (src1 === imagePieces[id1] && src2 === imagePieces[id2]){
			setTimeout(function(){playGoodSound();}, 100);
			playGoodSound();
			stats.doubles++;
			document.getElementById('doubles').innerHTML = stats.doubles;
		}
		else if (src1 === imagePieces[id1] || src2 === imagePieces[id2])
			playGoodSound();
		else {
			stats.misses++;
			document.getElementById('misses').innerHTML = stats.misses;
		}
		document.getElementById(id1).style.opacity = '1';
		id1 = '';
	}
	else {
		document.getElementById(id1).style.opacity = '1';
		id1 = '';
	}
	if (allCorrect()) 
		setTimeout(alertEndResults, 500);
}
function shuffle(){
	if (document.getElementById('layer1').innerHTML === '')
		return;
	for (let i = 0; i < numColsToCut * numRowsToCut; i++){
		let x = Math.floor((Math.random() * numColsToCut * numRowsToCut));
		let srcpom = document.getElementById(i.toString()).src;
		document.getElementById(i.toString()).src = document.getElementById(x.toString()).src;
		document.getElementById(x.toString()).src = srcpom;
	}
	reset();
	start();
	stats.moves = 0;
	stats.misses = 0;
	stats.doubles = 0;
	stats.retard = 0;
	document.getElementById('moves').innerHTML = stats.moves;
	document.getElementById('misses').innerHTML = stats.misses;
	document.getElementById('doubles').innerHTML = stats.doubles;
	document.getElementById('retard').innerHTML = stats.retard;
}

let timeElapsed = 0;
let timerID = -1;
function tick(){
    timeElapsed++;
	if (timeElapsed % 60 < 10)
		document.getElementById("timer").innerHTML = `${Math.floor(timeElapsed/60)}:0${timeElapsed%60}`;
    else
		document.getElementById("timer").innerHTML = `${Math.floor(timeElapsed/60)}:${timeElapsed%60}`;
}
function start(){
	if(timerID === -1)
        timerID = setInterval(tick, 1000);
}
function stop(){
	if(timerID !== -1){
		clearInterval(timerID);
        timerID = -1;
    }
}
function reset(){
    stop();
    timeElapsed = -1;
    tick();
}

function allCorrect(){
	for (let i = 0; i < numColsToCut * numRowsToCut; i++) {
		if (document.getElementById(i.toString()).src !== imagePieces[i])
			return false;
	}
	stop();
	return true;
}
function alertEndResults(){
	if(timeElapsed % 60 < 10)
		alert(`Well done!
Time: ${Math.floor(timeElapsed/60)}:0${timeElapsed%60}
Moves: ${stats.moves}
Misses: ${stats.misses}
Doubles: ${stats.doubles}
Retard: ${stats.retard}`);
	else 
		alert(`Well done!
Time: ${Math.floor(timeElapsed/60)}:${timeElapsed%60}
Moves: ${stats.moves}
Misses: ${stats.misses}
Doubles: ${stats.doubles}
Retard: ${stats.retard}`);
}