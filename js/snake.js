const randomInt = (max) => {
	return Math.floor(Math.random() * max);
}

const scoreText = document.getElementById("score");
const highscoreText = document.getElementById("high-score");
let highscore = 0;
let ctx = canvas.getContext("2d");
let snake = [[randomInt(16), randomInt(16)]], apple = [randomInt(16), randomInt(16)], [dx, dy] = [0, 0];
while(apple == snake[0])
	apple = [randomInt(16), randomInt(16)];

canvas.tabIndex = 0;
canvas.onclick = function(e) {
	document.body.scrollTop = canvas.offsetTop;
	canvas.focus();
}

// Controls
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

// Update frames
setInterval(() => {
	snake.unshift([(snake[0][0] + dx) & 15, (snake[0][1] + dy) & 15]);
	if("" + snake[0] == apple) {
		do apple = [Math.floor(Math.random() * 16), Math.floor(Math.random() * 16)];
		while(snake.some(seg => "" + seg == apple));
		scoreText.textContent = `Score: ${snake.length - 1}`;
	} else if(snake.length >= 257 || snake.slice(1).some(seg => "" + seg == snake[0])) {
		highscore = Math.max(highscore, snake.length - 2);
		highscoreText.textContent = `High Score: ${highscore}`;
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
	if(highscore) {
		const submitScore = document.getElementById("submit-score");
		submitScore.hidden = false;
	}
}, 125);

// Update scoreboard
const updateLeaderboard = (data) => {
	const scoreboard = document.getElementById('scoreboard').getElementsByTagName('tbody')[0];
	scoreboard.innerHTML = '';
	let i = 1;
	data.forEach((element) => {
		let newRow = scoreboard.insertRow(scoreboard.rows.length);
		newRow.innerHTML = `<tr><td>${i++}</td><td>${decodeURI(element.username)}</td><td>${element.highscore}</td></tr>`;
	});
}

// Get data
const getData = () => {
	const limit = 10;
	const url = `https://sheetdb.io/api/v1/th32u66mwoyfa?sheet=snake&sort_by=highscore&sort_order=desc&limit=${limit}`;
	const data = [];
	
	fetch(url)
	.then(res => res.text())
	.then(rep => {
		const jsData = JSON.parse(rep);
		jsData.forEach((element) => data.push({username: element.username, highscore: element.highscore}));
		updateLeaderboard(data);
	})
}

getData();

// Submit data
const addScore = (data) => {
	const username = data.username;
	const highscore = data.highscore;
	const url = "https://sheetdb.io/api/v1/th32u66mwoyfa";

	fetch(url, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			data: [
				{
					'id': "INCREMENT",
					'username': username,
					'highscore': highscore
				}
			]
		})
	})
	.then((response) => response.json())
	.finally(() => {
		getData();
	});
}

const updateScore = (data) => {
	const username = data.username;
	const highscore = data.highscore;
	const url = `https://sheetdb.io/api/v1/th32u66mwoyfa/username/${username}`

	fetch(url, {
		method: 'PATCH',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			data: {
				'highscore': highscore
			}
		})
	})
	.then((response) => response.json())
	.finally(() => {
		getData();
	});
}

const submitScore = () => {
	const data = Object.fromEntries(new FormData(document.querySelector('form')).entries());
	data.highscore = highscore;
	let username = data.username;
	if(!username.trim() || username.length < 3 || !highscore) //TODO add error message
		return;
	username = encodeURIComponent(username);
	const url = `https://sheetdb.io/api/v1/th32u66mwoyfa/search?username=${username}`;
	fetch(url)
	.then(res => res.text())
	.then(rep => {
		const jsData = JSON.parse(rep);
		jsData.length ? updateScore({username: username, highscore: highscore}) : addScore({username: username, highscore: highscore});
	});
}
