let board =[
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '']
    ];
  
  let w;
  let h;
  
  let ai = 'X';
  let human = 'O';
  
  let currentPlayer = human;
  
  let x1 = null;
  let y1 = null;
  let x2 = null;
  let y2 = null;
  
  let beep;
  let env;  
  function setup() {
    createCanvas(700, 500);
    w = width / 7;
    h = height / 6;
    env = new p5.Envelope();
    env.setADSR(0.03, 0.2, 0.3, 0.2);
    env.setRange(1.2, 0);
    beep = new p5.Oscillator();
    beep.setType('sine');
    beep.start();
    beep.amp(0);
    beep.freq(300);
  }
  
  const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
  
  function calc_depth(i, maximum) {
    let j=1;
    for(let n=i-1; n>1; n--) {
      i*=n;
      if(i > maximum) break;
      j++;
    }
    return j;
  }
  
  function mousePressed() {
    
    if(currentPlayer == ai) {
      console.log('ai playing');
      return;
    }
    
    let x = floor(mouseX / w);
    let y = 0;
    if(x>=0 && x<7) {
      if(board[y][x] == '') {
        while((y<5) && (board[y+1][x] == ''))
          y++;
        board[y][x] = human;
  
        let countDispo=0;
        for(x=0; x<7; x++) {
          for(y=0; y<6; y++) {
            if(board[y][x] == '')
              countDispo++;
          }
        } 
        let max_depth = calc_depth(countDispo, 1e13);
        if(checkWinner() == null) {
          currentPlayer = ai;
          sleep(100).then(() => {
            bestMove(max_depth);
            env.play(beep);
          });
        }
      }
    }
  }
  
  function checkWinner() {
    
    let x, y;
    for(x=0; x<7; x++) {
      for(y=0; y<3; y++) {
        if(board[y][x] != '') {
          if((board[y][x] == board[y+1][x]) &&
             (board[y][x] == board[y+2][x]) &&
             (board[y][x] == board[y+3][x]) ) {
            x1=x; y1=y; x2=x; y2=y+3;
            return(board[y][x]);
          }
        }
      }
    }
    for(x=0; x<4; x++) {
      for(y=0; y<6; y++) {
        if(board[y][x] != '') {
          if((board[y][x] == board[y][x+1]) &&
             (board[y][x] == board[y][x+2]) &&
             (board[y][x] == board[y][x+3]) ) {
            x1=x; y1=y; x2=x+3; y2=y;
            return(board[y][x]);
          }
        }
      }
    }
    for(x=0; x<4; x++) {
      for(y=3; y<6; y++) {
        if(board[y][x] != '') {
          if((board[y][x] == board[y-1][x+1]) &&
             (board[y][x] == board[y-2][x+2]) &&
             (board[y][x] == board[y-3][x+3]) ) {
            x1=x; y1=y; x2=x+3; y2=y-3;
            return(board[y][x]);
          }
        }
      }
    }  
    for(x=0; x<4; x++) {
      for(y=0; y<3; y++) {
        if(board[y][x] != '') {
          if((board[y][x] == board[y+1][x+1]) &&
             (board[y][x] == board[y+2][x+2]) &&
             (board[y][x] == board[y+3][x+3]) ) {
            x1=x; y1=y; x2=x+3; y2=y+3;
            return(board[y][x]);
          }
        }
      }
    }
    for(let x=0; x<7; x++) {
        if(board[0][x] == '')
          return null;
    }
    
    return('tie');
  }
  
  function draw() {
    let result = checkWinner();
    
    if(result != 'tie') {
      background(220);
    } else {
      background(190, 100, 90);
    }
    
    let w = width/7;
    let h = height/6;
    strokeWeight(1);
    for(let x=0; x<=7; x++)
      line(w*x, 0, w*x, height);
    for(let y=0; y<=6; y++)
      line(0, h*y, width, h*y);
  
    for(let x=0; x<7; x++) {
      for(let y=0; y<6; y++){
        let spot = board[y][x];
        strokeWeight(4);
        if(spot == human) {
          noFill();
          ellipse(x*w+w/2, y*h+h/2, w/2);
        } else if (spot == ai) {
          let xr = w / 8;
          let yr = h / 7;
          line(x*w+w/2-xr, y*h+h/2-xr,
               x*w+w/2+xr, y*h+h/2+xr);
          line(x*w+w/2-xr, y*h+h/2+xr,
               x*w+w/2+xr, y*h+h/2-xr);
        }
      } 
    }
  
    if (result != null) {
      noLoop();
      let resultP = createP('');
      resultP.style('font-size', '32pt');
      if (result == 'tie') {
        resultP.html('Match Tied!');
      } else {
        stroke(240, 40,40, 150);
        strokeWeight(10);
        line(x1*w+w/2, y1*h+h/2, x2*w+w/2, y2*h+h/2);
        resultP.html(`${result} Wins!`);
      }
    }
  }