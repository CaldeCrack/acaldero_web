const NUMBER_OF_GUESSES = 6;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let rightGuessString = "calde";
let colorMap = {'yellow': '#b59f3b', 'green': '#538d4e', 'grey': '#3a3a3c'};

function initBoard() {
    let board = document.getElementById("game-board");

    for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
        let row = document.createElement("div");
        row.className = "letter-row";

        for (let j = 0; j < 5; j++) {
            let box = document.createElement("div");
            box.className = "letter-box";
            row.appendChild(box);
        }

        board.appendChild(row);
    }
}

initBoard();

function insertLetter (pressedKey) {
    if (nextLetter === 5) return;
    pressedKey = pressedKey.toLowerCase();

    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining];
    let box = row.children[nextLetter];
    animateCSS(box, "pulse");
    box.textContent = pressedKey;
    box.classList.add("filled-box");
    currentGuess.push(pressedKey);
    nextLetter += 1;
}

function deleteLetter () {
    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining];
    let box = row.children[nextLetter - 1];
    box.textContent = "";
    box.classList.remove("filled-box");
    currentGuess.pop();
    nextLetter -= 1;
}

function rgb2hex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function shadeKeyBoard(letter, color) {
    for (const elem of document.getElementsByClassName("keyboard-button")) {
        if (elem.textContent === letter) {
            oldColor = rgb2hex(getComputedStyle(elem).backgroundColor).toLowerCase();
            if (oldColor === colorMap['green'])
                return;

            if (oldColor === colorMap['yellow'] && color !== 'green')
                return;

            elem.style.backgroundColor = colorMap[color];
            break;
        }
    }
}

async function checkGuess () {
    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining];
    let guessString = '';
    let rightGuess = Array.from(rightGuessString);

    for (const val of currentGuess)
        guessString += val;

    if (guessString.length != 5)
        return;

	if (guessString !== 'calde') {
		try {
			const response = await fetch(`https://corsproxy.io/?https://rae-api.com/api/words/${guessString}`);
			const data = await response.json();

			if (!data.ok) {
				toastr.error("¡Palabra inválida!");
				return;
			}
		} catch (error) {
			toast.error("Error al validar la palabra. Intenta de nuevo.");
			console.error("Error al contactar con la API:", error);
			return;
		}
	}

    for (let i = 0; i < 5; i++) {
        let letterColor = '';
        let box = row.children[i];
        let letter = currentGuess[i];

        let letterPosition = rightGuess.indexOf(currentGuess[i]);
        if (letterPosition === -1)
            letterColor = 'grey';
        else {
            if (currentGuess[i] === rightGuess[i])
                letterColor = 'green';
            else
                letterColor = 'yellow';

            rightGuess[letterPosition] = "#";
        }

        let delay = 250 * i;
        setTimeout(()=> {
            animateCSS(box, 'flipInX');
            box.style.backgroundColor = colorMap[letterColor];
            shadeKeyBoard(letter, letterColor);
        }, delay);
    }

    if (guessString === rightGuessString) {
        toastr.success("¡Adivinaste la palabra!");
        guessesRemaining = 0;
        return;
    } else {
        guessesRemaining -= 1;
        currentGuess = [];
        nextLetter = 0;

        if (guessesRemaining === 0) {
            toastr.error("¡Se te acabaron los intentos! ¡Perdiste!");
            toastr.info(`La palabra era: "${rightGuessString}"`);
        }
    }
}

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
    const target = e.target;

    if (!target.classList.contains("keyboard-button"))
        return;
    let key = target.textContent;

    if (key === "Del")
        key = "Backspace";

    document.dispatchEvent(new KeyboardEvent("keyup", {'key': key}));
})

document.addEventListener("keyup", (e) => {
    if (guessesRemaining === 0) return;

    let pressedKey = String(e.key);
    if (pressedKey === "Backspace" && nextLetter !== 0) {
        deleteLetter();
        return;
    }

    if (pressedKey === "Enter") {
        checkGuess();
        return;
    }

    let found = pressedKey.match(/[a-z]/gi);
    if (!found || found.length > 1)
        return;
    else
        insertLetter(pressedKey);
})

const animateCSS = (element, animation, prefix = 'animate__') =>
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    const node = element;
    node.style.setProperty('--animate-duration', '0.5s');
    node.classList.add(`${prefix}animated`, animationName);

    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
});
