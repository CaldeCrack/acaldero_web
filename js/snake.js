const randomInt = (max) => {
	return Math.floor(Math.random() * max);
}

const scoreText = document.getElementById("score");
const highScoreText = document.getElementById("high-score");
let highScore = 0;
let ctx = canvas.getContext("2d");
let snake = [[randomInt(16), randomInt(16)]], apple = [randomInt(16), randomInt(16)], [dx, dy] = [0, 0];

while(apple == snake[0])
	apple = [randomInt(16), randomInt(16)];

canvas.tabIndex = 0;
canvas.onclick = function(e) {
	document.body.scrollTop = canvas.offsetTop;
	canvas.focus();
}

canvas.addEventListener('keydown', function(e) {
	let key = e.which;
	switch(key) {
	case 37:
	case 65:
		[dx, dy] = [dx || -1, 0];
		break;
	case 38:
	case 87:
		[dx, dy] = [0, dy || -1];
		break;
	case 39:
	case 68:
		[dx, dy] = [dx || 1, 0];
		break;
	case 40:
	case 83:
		[dx, dy] = [0, dy || 1];
		break;
	}
	e.preventDefault();
	return false;
})

setInterval(() => {
	snake.unshift([(snake[0][0] + dx) & 15, (snake[0][1] + dy) & 15]);
	if("" + snake[0] == apple) {
		do apple = [Math.floor(Math.random() * 16), Math.floor(Math.random() * 16)];
		while(snake.some(seg => "" + seg == apple));
		scoreText.textContent = `Score: ${snake.length - 1}`;
	} else if(snake.length >= 257 || snake.slice(1).some(seg => "" + seg == snake[0])) {
		highScore = Math.max(highScore, snake.length - 2);
		highScoreText.textContent = `High Score: ${highScore}`;
		scoreText.textContent = 'Score: 0';
		snake.splice(1);
		[dx, dy] = [0, 0];
	} else
		snake.pop();
	ctx.clearRect(0, 0, 256, 256);
	ctx.fillStyle = "red";
	ctx.fillRect(apple[0] * 16, apple[1] * 16, 16, 16);
	ctx.fillStyle = "lime";
	snake.forEach(([x, y]) => ctx.fillRect(x * 16, y * 16, 16, 16));
}, 125);

$('#submit').on('click', function(e) {
    e.preventDefault();
    if( $('#username').val() ){
        $.ajax({
            url     : '../savescore.php',
            method  : 'POST',
            data    : { username: $('#username').val(), score: highScore },
            success : function( response ) {
                console.log( response );
            }
        });
    }
});
