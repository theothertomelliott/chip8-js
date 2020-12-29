import Chip8 from "./chip8.js"

document.getElementById("gobtn").addEventListener("click", loadROMAndStart, false);

for (var i = 0; i <= 0xF; i++) {
    let id = "key" + i.toString(16).toUpperCase();
    let b = document.getElementById(id);
    b.addEventListener("mousedown", () => { pressKey(i); }, false);
    b.addEventListener("mouseup", () => { releaseKey(i); }, false);
}

var chip8 = new Chip8();
var display = document.getElementById("display");

function pressKey(key) {
    console.log("press");
    console.log(key);
    chip8.setKey(key, true);
}

function releaseKey(key) {
    console.log("relase");
    console.log(key);
    chip8.setKey(key, false);
}

function loadROMAndStart() {
    var fileInput = document.getElementById("rominput");

    var files = fileInput.files;
    for (var i = 0; i < files.length; i++) {
        let file = files[i];

        let reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = function () {
            let data = new Uint8Array(reader.result);
            chip8.load_rom(data);
            runInterpreter();
        };

        reader.onerror = function () {
            console.log(reader.error);
        };
    }
}

function runInterpreter() {
    // Run 9 cycles for approx 500Hz clock speed
    for (var i = 0; i < 9; i++) {
        chip8.step();
    }

    // Draw frame
    let content = chip8.display;
    var text = "";
    for (var j = 0; j < 31; j++) {
        for (var i = 0; i < 63; i++) {
            text += content[i][j] ? "X" : " ";
        }
        text += "\n"
    }
    display.textContent = text;

    // Decrement at 60Hz
    chip8.decrement_timers();

    setTimeout(runInterpreter, 1000 / 60);
}