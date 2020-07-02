/*
	This is an attempt at making a clock from a seven-segment display
    based on code from adam antonio.
  */

class SevenSegment {
    constructor(value, position) {
      this.value = value;
      this.xOffset = position + 20;
    }
  
  
    getColor(val, shift) {
      let r = 255;
      let g = 0;
      let b = 0;
      let a = 35 + 255 * ((val >> shift) & 1);
      return color(r, g, b, a);
    }
  
  
    sevenSegment(val) {
      push();
      translate(this.xOffset,0);
      noStroke();
      noFill();
      // A
      fill(this.getColor(val, 6))
      rect(60, 20, 78, 18, 10, 10);
      // B
      fill(this.getColor(val, 5))
      rect(140, 40, 18, 98, 10, 10);
      // C
      fill(this.getColor(val, 4))
      rect(140, 160, 18, 98, 10, 10);
      // D
      fill(this.getColor(val, 3));
      rect(60, 260, 78, 18, 10, 10);
      // E
      fill(this.getColor(val, 2));
      rect(40, 160, 18, 98, 10, 10);
      // F
      fill(this.getColor(val, 1));
      rect(40, 40, 18, 98, 10, 10);
      // G
      fill(this.getColor(val, 0));
      rect(60, 140, 78, 18, 10, 10);
  
  
  
      pop();
    }
  }