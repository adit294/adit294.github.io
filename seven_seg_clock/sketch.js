let nums = [0x7E, 0x30, 0x6D, 0x79, 0x33, 0x5B, 0x5F, 0x70, 0x7F, 0x7B];
let index = 0;
let segments = [];
let numSegments = 6;
let offset;
let start = 90;


function setup() {
  createCanvas(1000, 400);
  frameRate(1);
  for (let i = 0; i < numSegments; i++) {
    if (i < 2) {
      offset = start +0;
    } else if (i < 4) {
      offset = start + 30;
    } else {
      offset = start + 60;
    }
    segments[i] = new SevenSegment(0, (i * 130) + offset);
  }
}

function draw() {
  translate(-140,0);
  background(0);
	let t = [];
  let h = hour();
  let m = minute();
  let s = second();
  t[0] = floor(h / 10);
  t[1] = h % 10;
  t[2] = floor(m / 10);
  t[3] = m % 10;
  t[4] = floor(s / 10);
  t[5] = s % 10;
  for (let s = 0; s < segments.length; s++) {
    segments[s].sevenSegment(nums[t[s]]);
    
  }
  
  
}



