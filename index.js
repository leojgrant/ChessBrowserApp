//*************************************ATTRIBUTES*******************************************//



// Initialise game parameters
var playing = false;
var player = 1;
var inActivePlayer = 2;
var player1RemovedPieces = []
var player2RemovedPieces = []
var thirdDomain = {};
var lastPieceClicked = "";
var prevSquareHover = "";
var curSquareHover = "";
var moveSFX = new Audio("sounds/chess_move.mp3");
var winSFX = new Audio("sounds/win.mp3");
var gameover = false;

// A copy of the domain to use when checking if the king is in checking, and a copy of the board layout
var testDomain = {}
Object.assign(testDomain, domain)

// Domain used to see where each piece can move to (it's updated after each turn)
var domain = {
  "pawn-black-a": ["6a", "5a"],
  "pawn-black-b": ["6b", "5b"],
  "pawn-black-c": ["6c", "5c"],
  "pawn-black-d": ["6d", "5d"],
  "pawn-black-e": ["6e", "5e"],
  "pawn-black-f": ["6f", "5f"],
  "pawn-black-g": ["6g", "5g"],
  "pawn-black-h": ["6h", "5h"],
  "castle-black-a": [],
  "knight-black-a": ["6a", "6c"],
  "bishop-black-a": [],
  "queen-black": [],
  "king-black": [],
  "bishop-black-b": [],
  "knight-black-b": ["6f", "6h"],
  "castle-black-b": [],
  "pawn-white-a": ["3a", "4a"],
  "pawn-white-b": ["3b", "4b"],
  "pawn-white-c": ["3c", "4c"],
  "pawn-white-d": ["3d", "4d"],
  "pawn-white-e": ["3e", "4e"],
  "pawn-white-f": ["3f", "4f"],
  "pawn-white-g": ["3g", "4g"],
  "pawn-white-h": ["3h", "4h"],
  "castle-white-a": [],
  "knight-white-a": ["3a", "3c"],
  "bishop-white-a": [],
  "queen-white": [],
  "king-white": [],
  "bishop-white-b": [],
  "knight-white-b": ["3f", "3h"],
  "castle-white-b": []
}

// Domain keys
var domainKeys = ["pawn-black-a", "pawn-black-b", "pawn-black-c", "pawn-black-d", "pawn-black-e", "pawn-black-f", "pawn-black-g", "pawn-black-h",
  "castle-black-a", "knight-black-a", "bishop-black-a", "queen-black", "bishop-black-b", "knight-black-b", "castle-black-b",
  "pawn-white-a", "pawn-white-b", "pawn-white-c", "pawn-white-d", "pawn-white-e", "pawn-white-f", "pawn-white-g", "pawn-white-h",
  "castle-white-a", "knight-white-a", "bishop-white-a", "queen-white", "bishop-white-b", "knight-white-b", "castle-white-b",
  "king-black", "king-white"
]



//*************************************EVENT HANDLERS*******************************************//



// If the game is not in a play state, start the first sequence of 300ms
$(document).keydown(function() {
  if (!playing) {
    playing = true;
    setTimeout(startGame, 300);
  }
  if (gameover) {
    location.reload(true);
    setTimeout(startGame, 300);
  }
})


// When a player clicks the submit button, try and play their move
$("button").click(function() {
  // Get the attempted move from the player
  var moveFrom = positionConverter($(".player" + player + " input[name=moveFrom]").val());
  var moveTo = positionConverter($(".player" + player + " input[name=moveTo]").val());
  var pieceID = $("#" + moveFrom + " .piece").attr("id");
  tryMove(pieceID, moveFrom, moveTo);
})


var draggedFrom;
var preventMove = true;
// Refreshing is required as otherwise the newly instantiated item is not recognised as a piece to the hover function
function refreshUIEventHandlers(){
  // When a player lets go of a click on a square of the board
  $(".square").hover(function(event){
    var el = $(event.target);
    if (el.hasClass("piece")){
      curSquareHover = el.parent().attr("id");
    } else {
      curSquareHover = el.attr("id");
    }

    if (lastPieceClicked != "" && !preventMove){
      autoMove();
      lastPieceClicked = "";
    }
    prevSquareHover = curSquareHover;
    lastPieceClicked = "";
  },
  function (event) {});

  $(".piece").mousedown(function(event){
    lastPieceClicked = $(event.target).attr("id");
    draggedFrom = $(event.target).parent().attr("id");
  });

  $(".piece").mouseup(function(event){
    lastPieceClicked = "";
  });


  // document.body.style.cursor = "wait";
  // $( ".piece" ).draggable({ cursor: "pointer" });
  document.ondragend = function (event) {
    // Change the cursor style
    document.body.style.cursor = "default";
    // Prevent accidental moves
    if ($("#" + draggedFrom).is(":hover")){
      preventMove = true;
    } else {
      preventMove = false;
    }
  };

  // document.ondragstart = function (event) {
  //   // Change the cursor style
  //   document.body.style.cursor = "wait";
  // };



  // Hover method takes an inFunction and outFunction as arguments, and changes the colour of the domain spaces of the piece
  $(".piece").hover(function (event) {
    if (($(event.target).hasClass("white-piece") && player == 1) || ($(event.target).hasClass("black-piece") && player == 2)){
      var pieceID = $(event.target).attr("id");
      for (idx in domain[pieceID]) {
        $("#" + domain[pieceID][idx]).addClass("square-highlight")
      }
    }
  },
  function (event) {
    var pieceID = $(event.target).attr("id");
    for (idx in domain[pieceID]) {
      $("#" + domain[pieceID][idx]).removeClass("square-highlight")
    }
  })

  // Automatically fills in the inputs through clicking on pieces
  $(".piece").click(function(event) {
    // If it is your piece (either black or white), fill in
    var piece = $(event.target)
    if ((piece.hasClass("white-piece") && player == 1) || (piece.hasClass("black-piece") && player == 2)){
      var moveFrom = piece.parent().attr("id");
      $(".player" + player + " input[name=moveFrom]").val(positionConverter(moveFrom));
    } else {
      var moveTo = piece.parent().attr("id");
      $(".player" + player + " input[name=moveTo]").val(positionConverter(moveTo));
    }
  });

  // Automatically fills in the inputs through clicking on squares
  $(".square").click(function(event) {
    console.log("wasssssp");
    var el = $(event.target);
    var movePos = el.attr("id");
    // If the element clicked on is a square (not a piece)
    if (el.hasClass("square")){
      // If the square space is empty assume its a moveTo input
      if (el.html() == ""){
          $(".player" + player + " input[name=moveTo]").val(positionConverter(movePos));
      } else {
        piece = el.children();
        // If player clicked on a square with their own piece
        if (piece.hasClass("white-piece") && player == 1 || piece.hasClass("black-piece") && player == 2){
          $(".player" + player + " input[name=moveFrom]").val(positionConverter(movePos));
        } else {
          $(".player" + player + " input[name=moveTo]").val(positionConverter(movePos));
        }
      }
    }
  });
}



function autoMove(){
  tryMove(lastPieceClicked, prevSquareHover, curSquareHover);
}

function positionConverter(position){
  return position[1] + position[0];
}



function makeSound(){
  moveSFX.play();
}

var gameoverMessage;
function applyGameoverStyle(){
  $(".body-container").addClass("gameover-main");
  var gameoverTitle = $(".gameover-title");
  var gameoverText = $(".gameover-text");
  // This check prevents a bug where the game ends but some pieces remain updside down
  if ($(".chessboard").hasClass("rotated")){
    $(".chessboard .piece").addClass("rotated");
  }
  // Turn off highlighting the domain
   $('.piece').unbind('mouseenter mouseleave');
  gameoverTitle.text(gameoverMessage);
  gameoverText.text("(Press any key to play again)");
  gameoverTitle.removeClass("gameover-in-game");
  gameoverText.removeClass("gameover-in-game");
}

function one(){

}


function addQueen(pieceID){
  var position = $("#" + pieceID).parent().attr("id");
  var queenID = parseInt(Math.random() * 10000);
  var queenHTML;
  if (player == 1) {
    queenHTML = "<img class='piece white-piece queen' id='" + queenID + "' src='pieces/white-queen-img.png' alt='white-queen-img'>";
  } else {
    queenHTML = "<img class='piece black-piece queen' id='" + queenID + "' src='pieces/black-queen-img.png' alt='black-queen-img'>";
  }
  $("#" + position).html(queenHTML);
  domainKeys.push(queenID);
  domain[queenID] = [];
}


//*************************************PRIMARY FUNCTIONS*******************************************//



// Initialise the game
function startGame() {
  setGamePlayStyle();
  if (player == 1) {
    $(".player2").addClass("waiting");
    $(".player1").removeClass("waiting");
  } else {
    $(".player1").addClass("waiting");
    $(".player2").removeClass("waiting");
  }
  refreshUIEventHandlers();
}


// If their move is in the domain of that piece and they are tryig to move the correct coloured piece, play it
function tryMove(pieceID, moveFrom, moveTo){
  if (moveValid(pieceID, moveFrom, moveTo)) {
    console.log("Valid move");
    movePiece(pieceID, moveFrom, moveTo);
    updateDomain();
    if (endOfGame()) {
      makeSound();
      applyGameoverStyle();
      return;
    }
    changePlayerTurn();
    makeSound();
  } else {
    console.log("Invalid move - try again.");
  }
}


// Check if move is in the domain of the piece
function moveValid(pieceID, moveFrom, moveTo) {
  var piece = $("#" + pieceID);
  // If player trying to move wrong coloured piece
  if ((piece.hasClass("white-piece") && player != 1) || (piece.hasClass("black-piece") && player != 2)) {
    return false;
  }
  // If the position the piece is trying to be moved to is in the domain, return true
  for (idx in domain[pieceID]) {
    if (domain[pieceID][idx] == moveTo) {
      return true;
    }
  }
  return false;
}


// Move a piece to a specific position
function movePiece(pieceID, moveFrom, moveTo) {
  var piece = $("#" + pieceID);
  var pieceHTML = piece.prop("outerHTML");
  var blockingPiece = $("#" + moveTo + " .piece");
  // If there is a blocking piece, remove it
  if (blockingPiece.length > 0) {
    var blockingPieceID = blockingPiece.attr("id");
    removePiece(blockingPieceID);
    addToRemovedPieces(blockingPieceID);
  } else {
    addToRemovedPieces("");
  }
  // Move the piece to its new position
  piece.parent().html("");
  $("#" + moveTo).append(pieceHTML);
  // Refresh the domain highlighting method to accept the new piece
  refreshUIEventHandlers();
}


// Update the domain
function updateDomain(primaryUpdate=true) {
  for (idx in domainKeys) {
    // Reset domain for this piece
    domain[domainKeys[idx]] = [];
    // Update the domain of the piece
    var piece = $("#" + domainKeys[idx])
    // If piece is dead then skip it
    if (piece.hasClass("dead")){
      continue;
    }
    // Update the pieces domain based on its type
    if (piece.hasClass("pawn")) {
      updatePawnDomain(piece, primaryUpdate);
    } else if (piece.hasClass("castle")){
      updateCastleDomain(piece);
    } else if (piece.hasClass("knight")){
      updateKnightDomain(piece);
    } else if (piece.hasClass("bishop")){
      updateBishopDomain(piece);
    } else if (piece.hasClass("queen")){
      updateQueenDomain(piece);
    } else if (piece.hasClass("king")){
      updateKingDomain(piece);
    }
  }
  if (primaryUpdate){
    removeIfCheck();
  }
}


// Checks for checkmate
function endOfGame() {
  var white_count = 0;
  var black_count = 0;
  for (idx in domainKeys){
    var pieceID = domainKeys[idx];
    var pieceDomain = domain[pieceID];
    var piece = $("#" + pieceID);
    if (piece.hasClass("white-piece")){
      white_count += pieceDomain.length;
    } else {
      black_count += pieceDomain.length;
    }
  }
  // If the opposing player has no possible moved to make
  if (white_count > 0 && black_count > 0){
    return false;
  }
  // Else if the player has moved themselves into a space where they have no moves - allow the other player to try and avoid stalemate with one of their moves
  else if ((player == 1 && white_count == 0 && black_count != 0) || (player == 2 && black_count == 0 && white_count != 0)){
    return false;
  } else {
    // If stalemate, set stalemate message, else set checkmate message
    if ((player == 1 && black_count == 0 && !inCheck($("#king-black"), $("#king-black").parent().attr("id"))) || (player == 2 && white_count == 0 && !inCheck($("#king-white"), $("#king-white").parent().attr("id"))))  {
      gameoverMessage = "Stalemate";
    } else {
      gameoverMessage = "Player " + player + " wins!";
      winSFX.play();
    }
    gameover = true;
    return true;
  }
}


// Check if the players king would be in check in the position provided
function inCheck(king_piece, position){
  for (idx in domainKeys) {
    var testPiece = domainKeys[idx];
    // If the position of the king overlaps with the domain of another piece
    if ($.inArray(position, domain[testPiece]) > -1) {
      // If the position the king would be in is in the domain of another piece AND that piece is of oppsite colour, return true
      var threateningPiece = $("#" + domainKeys[idx]);
      if (threateningPiece.hasClass("white-piece") && king_piece.hasClass("black-piece") || threateningPiece.hasClass("black-piece") && king_piece.hasClass("white-piece")){
        return true;
      }
    }
  }
  return false;
}


// Undo the move just performed
function undoMove(pieceID, movedFrom, movedTo) {
  // Move the piece back to its orginal position
  var piece = $("#" + pieceID);
  var pieceHTML = piece.prop("outerHTML");
  piece.parent().html("");
  $("#" + movedFrom).append(pieceHTML);
  // Restore any removed pieces
  var removedPieceID;
  if (player === 2){
    removedPieceID = player1RemovedPieces.pop(player1RemovedPieces.length - 1);
  } else {
    removedPieceID = player2RemovedPieces.pop(player2RemovedPieces.length - 1);
  }
  if (removedPieceID != "") {
    addPiece(removedPieceID, movedTo);
  }
  // Refresh the domain highlighting method to accept the new piece
  refreshUIEventHandlers();
}


// Change the player turn
function changePlayerTurn() {
  if (player == 1) {
    player = 2;
    $(".player1").addClass("waiting");
    $(".player2").removeClass("waiting");
    $(".chessboard").addClass("rotated");
    $(".chessboard .piece").addClass("rotated");
  } else {
    player = 1;
    $(".player2").addClass("waiting");
    $(".player1").removeClass("waiting");
    $(".chessboard").removeClass("rotated");
    $(".chessboard .piece").removeClass("rotated");
  }
}



//*************************************SECONDARY FUNCTIONS*******************************************//



// Set the look of the game while it is being played
function setGamePlayStyle() {
  $(".title").addClass("title-in-game");
  $(".row").addClass("row-in-game");
}


// This function removes a piece from the chessboard
function removePiece(pieceID) {
  piece = $("#" + pieceID);
  piece.addClass("dead");
  piece.removeClass("rotated");
  pieceHTML = piece.prop("outerHTML");
  piece.parent().html("");
  if ($(".player" + player + " .top-piece-holder img").length < 8) {
    $(".player" + player + " .top-piece-holder").append(pieceHTML);
  } else {
    $(".player" + player + " .bottom-piece-holder").append(pieceHTML);
  }
}


// Add the removed piece to the respective removed list
function addToRemovedPieces(removedPieceID){
  if (player === 2){
    player1RemovedPieces.push(removedPieceID);
  } else {
    player2RemovedPieces.push(removedPieceID);
  }
}


// Add a piece back to the board after being removed
function addPiece(removedPieceID, moveTo) {
  removedPiece = $("#" + removedPieceID);
  removedPiece.removeClass("dead");
  removedPieceHTML = removedPiece.prop("outerHTML");
  removedPiece.remove();
  $("#" + moveTo).append(removedPieceHTML);
}


// This function will filter the domain for positions that would result in the player putting themselves into check
function removeIfCheck() {
  testDomain = Object.assign(testDomain, domain);
  for (idx in domainKeys){
    var testPieceID = domainKeys[idx];
    var testPositions = testDomain[testPieceID];
    var oldPositionID = $("#" + testPieceID).parent().attr("id")

    domain[testPieceID] = [];
    thirdDomain[testPieceID] = []

    for (i in testPositions) {
      var testPositionID = testPositions[i];
      movePiece(testPieceID, oldPositionID, testPositionID);
      updateDomain(primaryUpdate = false)
      var king;
      // Get the correct king to test for self check
      if ($("#" + testPieceID).hasClass("white-piece")){
        king = $("#king-white");
      } else {
        king = $("#king-black");
      }
      // Check if the player has put themself into check
      if (!inCheck(king, king.parent().attr("id"))){
        thirdDomain[testPieceID].push(testPositionID);
      }
      undoMove(testPieceID, oldPositionID, testPositionID);
    }
  }
  domain = Object.assign(domain, thirdDomain);
}



//*************************************DOMAIN UPDATE FUNCTIONS*******************************************//



// Update the domain of a pawn
function updatePawnDomain(piece, primaryUpdate) {
  // Get the ID of the pawn and its current position on the board and the next row it will move to
  pieceID = piece.attr("id");
  var currentPos = piece.parent().attr("id");
  row = currentPos[0];
  col = currentPos[1];
  var nextRow;
  if (piece.hasClass("white-piece")) {
    // If pawn needs to become a queen
    if (row == 8){
      // Turn white pawn into a white queen obj and update its domain (if not already done automatically for the players next turn)
      if (primaryUpdate){
        addQueen(pieceID);
        // updateDomain();
        return;
      }
      // updateDomain();
      return;
    }
    nextRow = parseFloat(row) + 1;
  } else if (piece.hasClass("black-piece")) {
    if (row == 1){
      // Turn black pawn into a black queen obj and update its domain (if not already done automatically for the players next turn)
      if (primaryUpdate) {
        addQueen(pieceID);
        // updateDomain();
        return;
      }
      // updateDomain();
      return;
    }
    nextRow = parseFloat(row) - 1;
  }
  // Get the position of the space in front of the pawn, and the piece (if any) that may be there blocking the way
  var domainPos = nextRow + col;
  var blockingPiece = $("#" + domainPos).prop("innerHTML");
  // If there is no piece directly in front blocking it
  if (blockingPiece == "") {
    domain[pieceID].push(domainPos);
    // If it is in it's original position and can move 2 spaces as not blocked by one in front
    var nextNextRow;
    if ((piece.hasClass("white-piece") && row == 2) || (piece.hasClass("black-piece") && row == 7)){
      if (row == 2){
        nextNextRow = nextRow + 1;
      }
      else if (row == 7){
        nextNextRow = nextRow - 1;
      }
      domainPos = nextNextRow + col;
      blockingPiece = $("#" + domainPos).prop("innerHTML");
      // Add the space two jumps ahead if all clear too
      if (blockingPiece == "") {
        domain[pieceID].push(domainPos);
      }
    }
  }
  // If pawn can take another player and move diagonal
  var diagonalAttackDomain = pawnAttackDomain(piece);
  for (idx in diagonalAttackDomain) {
    domain[pieceID].push(diagonalAttackDomain[idx]);
  }
}


// Update the domain of a bishop
function updateBishopDomain(piece, checkforcheck){
  var pieceID = piece.attr("id");
  var currentPos = piece.parent().attr("id");
  var bishopDomain = getFullDiagonalDomain(piece);
  for (idx in bishopDomain) {
    domain[pieceID].push(bishopDomain[idx]);
  }
}


// Update the domain of a castle
function updateCastleDomain(piece, checkforcheck) {
  var pieceID = piece.attr("id");
  var currentPos = piece.parent().attr("id");
  var castleDomain = getFullStraightDomain(piece);
  for (idx in castleDomain) {
    domain[pieceID].push(castleDomain[idx]);
  }
}


// Update the domain of a knight
function updateKnightDomain(piece, checkforcheck) {
  var pieceID = piece.attr("id");
  var currentPos = piece.parent().attr("id");
  var valCol = parseFloat(currentPos.charCodeAt(1));
  var row = parseFloat(currentPos[0]);
  var temp = [];
  var knightDomain = [];
  while (true) {
    // Add all potntial moves
    var upper_left = (row + 2) + String.fromCharCode(valCol - 1);
    var upper_right = (row + 2) + String.fromCharCode(valCol + 1);
    var lower_left = (row - 2) + String.fromCharCode(valCol - 1);
    var lower_right = (row - 2) + String.fromCharCode(valCol + 1);
    var left_upper = (row + 1) + String.fromCharCode(valCol - 2);
    var left_lower = (row - 1) + String.fromCharCode(valCol - 2);
    var right_upper = (row + 1) + String.fromCharCode(valCol + 2);
    var right_lower = (row - 1) + String.fromCharCode(valCol + 2);
    temp.push(upper_left, upper_right, lower_left, lower_right, left_upper, left_lower, right_upper, right_lower);
    // Remove all impossible moves
    for (idx in temp){
      var domRow = temp[idx][0];
      var domCol = temp[idx].charCodeAt(1);
      // Filter for if row 10 is reache, or row or cols are out of bounds
      if (temp[idx].length > 2 || domRow > 8 || domRow < 1 || domCol < 97 || domCol > 104){
        continue;
      }
      var blockingPiece = $("#" + temp[idx] + " .piece");
      // If there is a piece here, see if this piece can add onto it or not
      if (blockingPiece.length > 0){
        if (blockingPiece.hasClass("white-piece") && piece.hasClass("black-piece") || blockingPiece.hasClass("black-piece") && piece.hasClass("white-piece")){
          knightDomain.push(temp[idx]);
        }
        continue;
      }
      // If the space is empty and real, add it to the domain
      knightDomain.push(temp[idx]);
    }
    domain[pieceID] = knightDomain;
    return knightDomain;
  }
}


// Update the domain of a queen
function updateQueenDomain(piece, checkforcheck) {
  var pieceID = piece.attr("id");
  var currentPos = piece.parent().attr("id");
  var queenDomain = getFullStraightDomain(piece);
  queenDomain = queenDomain.concat(getFullDiagonalDomain(piece));
  for (idx in queenDomain) {
    domain[pieceID].push(queenDomain[idx]);
  }
}


// Update the domain of the king
function updateKingDomain(piece) {
  var pieceID = piece.attr("id");
  var currentPos = piece.parent().attr("id");
  var valCol = parseFloat(currentPos.charCodeAt(1));
  var row = parseFloat(currentPos[0]);
  var temp = [];
  var kingDomain = [];
  // Add all potntial moves
  var upper = (row + 1) + String.fromCharCode(valCol);
  var upper_left = (row + 1) + String.fromCharCode(valCol - 1);
  var upper_right = (row + 1) + String.fromCharCode(valCol + 1);
  var lower = (row - 1) + String.fromCharCode(valCol);
  var lower_left = (row - 1) + String.fromCharCode(valCol - 1);
  var lower_right = (row - 1) + String.fromCharCode(valCol + 1);
  var right = row + String.fromCharCode(valCol + 1);
  var left = row + String.fromCharCode(valCol - 1);
  temp.push(upper, upper_left, upper_right, lower, lower_left, lower_right, right, left);
  // Remove all impossible moves
  for (idx in temp){
    var domPos = temp[idx];
    var domRow = temp[idx][0];
    var domCol = temp[idx].charCodeAt(1);
    // Filter for if row or cols are out of bounds
    if (domRow > 8 || domRow < 1 || domCol < 97 || domCol > 104){
      continue;
    }
    var blockingPiece = $("#" + domPos + " .piece");
    // If there is a piece here, see if this piece can add onto it or not
    if (blockingPiece.length > 0){
      if (blockingPiece.hasClass("white-piece") && piece.hasClass("black-piece") || blockingPiece.hasClass("black-piece") && piece.hasClass("white-piece")){
        kingDomain.push(domPos);
      }
      continue;
    }
    // If the space is empty and real, add it to the domain
    kingDomain.push(domPos);
  }
  domain[pieceID] = kingDomain;
  return kingDomain;
}


//  This function returns the attacking domain of a pawn
function pawnAttackDomain(piece) {
  // Declare variables an assign based on colour of piece
  var leftAttackDomain;
  var rightAttackDomain;
  if (piece.hasClass("white-piece")) {
    leftAttackDomain = directionalDiagDomain(piece, "upper", "left");
    rightAttackDomain = directionalDiagDomain(piece, "upper", "right");
  } else if (piece.hasClass("black-piece")) {
    leftAttackDomain = directionalDiagDomain(piece, "lower", "left");
    rightAttackDomain = directionalDiagDomain(piece, "lower", "right");
  }
  var leftPiece = $("#" + leftAttackDomain[0] + " .piece");
  var rightPiece = $("#" + rightAttackDomain[0] + " .piece");
  attackDomain = []
  // If there is only one item in upperLeft, and it has a black piece (which it must do if it was added to the domain)
  if (leftAttackDomain.length == 1 && leftPiece.length > 0) {
    attackDomain.push(leftAttackDomain[0])
  }
  // If there is only one item in upperRight, and it has a black piece (which it must do if it was added to the domain)
  if (rightAttackDomain.length == 1 && rightPiece.length > 0) {
    attackDomain.push(rightAttackDomain[0])
  }
  return attackDomain;
}


// Returns all straight spaces that may be taken by the piece
function getFullStraightDomain(piece) {
  var upperDomain = directionalStraightDomain(piece, "upper");
  var lowerDomain = directionalStraightDomain(piece, "lower");
  var leftDomain = directionalStraightDomain(piece, "left");
  var rightDomain = directionalStraightDomain(piece, "right");
  return upperDomain.concat(lowerDomain).concat(leftDomain).concat(rightDomain);
}


// Returns the domain of the piece along the straight specified with the input
function directionalStraightDomain(piece, dir) {
  var currentPos = piece.parent().attr("id");
  var valCol = currentPos.charCodeAt(1);
  var row = parseFloat(currentPos[0]);
  var straightDomain = [];
  while (true) {
    // Increment the row or column based on the direction inputs (and return straightDomain if row or column is out of bounds)
    if (dir == "upper") {
      row += 1;
      if (row > 8){
        return straightDomain;
      }
    } else if  (dir == "lower") {
      row -= 1;
      if (row < 1){
        return straightDomain;
      }
    } else if (dir == "left") {
      valCol -= 1;
      if (valCol < 97){
        return straightDomain;
      }
    } else if (dir == "right") {
      valCol += 1;
      if (valCol > 104){
        return straightDomain;
      }
    }
    // Find the position of the domain being tested, and try to get the piece (if there is one) that's in that spoce
    var domainPos = row + String.fromCharCode(valCol);
    var blockingPiece = $("#" + domainPos + " .piece");
    // If there is no piece in the space, add space to straightDomain
    if (blockingPiece.length == 0) {
      straightDomain.push(row + String.fromCharCode(valCol));
      continue;
    }
    // Else if the piece blocking the path is a differently coloured to the piece we are trying to move there,  add to straightDomain and return it
    else if (blockingPiece.hasClass("white-piece") && piece.hasClass("black-piece") || blockingPiece.hasClass("black-piece") && piece.hasClass("white-piece")) {
      straightDomain.push(row + String.fromCharCode(valCol));
      return straightDomain;
    }
    // Else simply return the list as the piece is blocked by a piece of the same colour
    else {
      return straightDomain;
    }
  }
}


// Returns all diagonal spaces that may be taken by the piece (if the piece acted as a bishop)
function getFullDiagonalDomain(piece) {
  var upperLeft = directionalDiagDomain(piece, "upper", "left");
  var upperRight = directionalDiagDomain(piece, "upper", "right");
  var lowerLeft = directionalDiagDomain(piece, "lower", "left");
  var lowerRight = directionalDiagDomain(piece, "lower", "right");
  return upperLeft.concat(upperRight).concat(lowerLeft).concat(lowerRight);
}


// Gets the domain of the upper diagonals if the piece acted as a bishop
function directionalDiagDomain(piece, verticalDir, horizontalDir) {
  var currentPos = piece.parent().attr("id");
  var valCol = currentPos.charCodeAt(1);
  var row = parseFloat(currentPos[0]);
  var diagDomain = []
  while (true) {
    // Increment the row and column based on the direction inputs (and return diagDomain if row or column is out of bounds)
    if (verticalDir == "upper") {
      row += 1;
      if (row > 8){
        return diagDomain;
      }
    } else if  (verticalDir == "lower") {
      row -= 1;
      if (row < 1){
        return diagDomain;
      }
    }
    if (horizontalDir == "left") {
      valCol -= 1;
      if (valCol < 97){
        return diagDomain;
      }
    } else if (horizontalDir == "right") {
      valCol += 1;
      if (valCol > 104){
        return diagDomain;
      }
    }
    // Find the position of the domain being tested, and try to get the piece (if there is one) that's in that spoce
    var domainPos = row + String.fromCharCode(valCol);
    var blockingPiece = $("#" + domainPos + " .piece");
    // If there is no piece in the space, add space to diagDomain
    if (blockingPiece.length == 0) {
      diagDomain.push(row + String.fromCharCode(valCol));
      continue;
    }
    // Else if the piece blocking the path is a differently coloured to the piece we are trying to move there,  add to diagDomain and return it
    else if (blockingPiece.hasClass("white-piece") && piece.hasClass("black-piece") || blockingPiece.hasClass("black-piece") && piece.hasClass("white-piece")) {
      diagDomain.push(row + String.fromCharCode(valCol));
      return diagDomain;
    }
    // Else simply return the list as the piece is blocked by a piece of the same colour
    else {
      return diagDomain;
    }
  }
}
