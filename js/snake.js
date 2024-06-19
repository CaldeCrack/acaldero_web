// Se que el código está horrible pero hacerlo bonito sería overkill para lo que es

const randomInt = (max) => {
	return Math.floor(Math.random() * max);
}

const crypt = (salt, text) => {
	const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
	const byteHex = (n) => ("0" + Number(n).toString(16)).substring(-2);
	const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
	return text.split("").map(textToChars).map(applySaltToChar).map(byteHex).join("");
};

const scoreText = document.getElementById("score");
const highscoreText = document.getElementById("high-score");
const submitScore = document.getElementById("submit-score");
const error_messages = document.getElementById("error-messages");
const ctx = canvas.getContext("2d");
const akshdfklashd = "e10g0yfzxjmlm37igbtqkyth0jo7voo69v0tfmtw";
let snake = [[randomInt(16), randomInt(16)]], apple = [randomInt(16), randomInt(16)], [dx, dy] = [0, 0];
let highscore = 0;
let lost = false;
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
		lost = false;
		submitScore.hidden = true;
		error_messages.hidden = true;
		[dx, dy] = [dx || -1, 0];
		break;
	case 38:
	case 87:
		lost = false;
		submitScore.hidden = true;
		error_messages.hidden = true;
		[dx, dy] = [0, dy || -1];
		break;
	case 39:
	case 68:
		lost = false;
		submitScore.hidden = true;
		error_messages.hidden = true;
		[dx, dy] = [dx || 1, 0];
		break;
	case 40:
	case 83:
		lost = false;
		submitScore.hidden = true;
		error_messages.hidden = true;
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
		with (Math) do apple = [floor(random() * 16), floor(random() * 16)];
		while(snake.some(seg => "" + seg == apple));
		scoreText.textContent = `Score: ${snake.length - 1}`;
	} else if(!lost && (snake.length >= 257 || snake.slice(1).some(seg => "" + seg == snake[0]))) {
		highscore = Math.max(highscore, snake.length - 2);
		highscoreText.textContent = `High Score: ${highscore}`;
		scoreText.textContent = 'Score: 0';
		snake.splice(1);
		[dx, dy] = [0, 0];
		lost = true;
		if(highscore)
			submitScore.hidden = false;
	} else
		snake.pop();

	ctx.clearRect(0, 0, 256, 256);
	ctx.fillStyle = "red";
	ctx.fillRect(apple[0] * 16, apple[1] * 16, 16, 16);
	ctx.fillStyle = "lime";
	snake.forEach(([x, y]) => ctx.fillRect(x * 16, y * 16, 16, 16));
}, 125);

// Update scoreboard
const updateScoreboard = (data) => {
	const scoreboard = document.getElementById('scoreboard').getElementsByTagName('tbody')[0];
	scoreboard.innerHTML = '';
	let i = 1;
	data.forEach((element) => {
		let newRow = scoreboard.insertRow(scoreboard.rows.length);
		newRow.innerHTML = `<tr><td>${i++}</td><td>${decodeURI(element.username)}</td><td>${element.highscore}</td></tr>`;
	});
}

const getData = () => {
	const limit = 10;
	const url = `https://sheetdb.io/api/v1/th32u66mwoyfa?sheet=snake&sort_by=highscore&sort_order=desc&limit=${limit}`;
	const data = [];

	fetch(url, {headers: {'Authorization': `Bearer ${akshdfklashd}`}})
	.then(res => res.text())
	.then(rep => {
		const jsData = JSON.parse(rep);
		jsData.forEach((element) => data.push({username: element.username, highscore: element.highscore}));
		updateScoreboard(data);
	})
}
getData();

// Submit data
const addScore = (data) => {
	const username = data.username;
	const password = data.password;
	const highscore = data.highscore;
	const url = "https://sheetdb.io/api/v1/th32u66mwoyfa";

	fetch(url, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${akshdfklashd}`
		},
		body: JSON.stringify({
			data: [
				{
					'id': "INCREMENT",
					'username': username,
					'password': password,
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
	const prevscore = data.prevscore;
	if(prevscore >= highscore)
		return;
	const url = `https://sheetdb.io/api/v1/th32u66mwoyfa/username/${username}`;

	fetch(url, {
		method: 'PATCH',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${akshdfklashd}`
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

const postScore = () => {
	const data = Object.fromEntries(new FormData(document.querySelector('form')).entries());
	const lkja1lrln = "K2LHF87agL85oa85oLF58Ogf298";
	data.highscore = highscore;
	let username = data.username;
	const password = crypt(lkja1lrln, data.password);

	if(!username.trim() || username.length < 3) {
		error_messages.hidden = false;
		error_messages.innerText = "Usuario debe tener al menos 3 carácteres";
		return;
	}

	const txtScore = Number(highscoreText.innerText.split(" ").at(-1));
	if(typeof(highscore) != "number" || txtScore != highscore || highscore < 1 || highscore > 255) {
		error_messages.hidden = false;
		error_messages.innerText = "Puntaje a subir es inválido";
		return;
	}

	if(!data.password.trim() || data.password.length < 8) {
		error_messages.hidden = false;
		error_messages.innerText = "Contraseña debe tener al menos 8 carácteres";
		return;
	}

	error_messages.hidden = true;
	username = encodeURIComponent(username);
	const url = `https://sheetdb.io/api/v1/th32u66mwoyfa/search?username=${username}&casesensitive=true`;

	fetch(url, {headers: {'Authorization': `Bearer ${akshdfklashd}`}})
	.then(res => res.text())
	.then(rep => {
		submitScore.hidden = true;
		const jsData = JSON.parse(rep);
		if(jsData.length && (password != jsData.password)) {
			error_messages.hidden = false;
			error_messages.innerText = "Contraseña incorrecta";
			return;
		}
		jsData.length ? updateScore({username: username, highscore: highscore, prevscore: jsData[0].highscore})
						: addScore({username: username, password: password, highscore: highscore});
	});
}
