function bestMove(maxDepth) {
    let bestScore = -Infinity;
    let move=null;
    for(let x=0; x<7; x++) {
      let y = 0;
      if(board[y][x] == '') {
        while((y<5) && (board[y+1][x] == ''))
          y++;
  
        board[y][x] = ai;
        let score = minimax(board, 0, -Infinity, Infinity, 7, false);
        board[y][x] = '';
  
        if(score > bestScore) {
          bestScore = score;
          move = {x,y};
        } else if ((score == bestScore) && (random(0,1) < 0.2))
          move = {x,y};
      }
    }
    
    if(move !== null)
      board[move.y][move.x] = ai;
  
    currentPlayer = human;
  }
  
  let scores = {
    X: 1,
    O: -1,
    tie : 0
  }
  
  function minimax(board, depth, alpha, beta, maxDepth, isMaximizing) {
    let result = checkWinner();
    if(result != null) {
      let score = scores[result];
      return score;
    }
    if(depth > maxDepth)
        return 0;
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      for(let x=0; x<7; x++) {
        let y = 0;
        if(board[y][x] == '') {
          while((y<5) && (board[y+1][x] == ''))
            y++;
          board[y][x] = ai;
          let score = minimax(board, depth+1, alpha, beta, 7, false);
          board[y][x] = '';
          score/=depth+1;
          bestScore = max(score, bestScore);
          alpha = max(alpha, score);
          if(beta <= alpha)
            break;
          }
        }
      return bestScore;
    } else {
      let bestScore = Infinity;
  
      for(let x=0; x<7; x++) {
        let y = 0;
        if(board[y][x] == '') {
          while((y<5) && (board[y+1][x] == ''))
            y++;
          board[y][x] = human;
          let score = minimax(board, depth+1, alpha, beta, 7, true);
          board[y][x] = '';
          score/= depth+1;
          bestScore = min(score, bestScore);
          beta = min(score, beta);
          if(beta <= alpha)
            break;
          }
      }
      return bestScore;
    }
    
  }
  
  