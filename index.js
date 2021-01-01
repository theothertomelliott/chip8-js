import Chip8 from "./chip8.js"

document.getElementById("gobtn").addEventListener("click", loadROMAndStart, false);

// Set up key bindings
for (var i = 0; i <= 0xF; i++) {
    let id = "key" + i.toString(16).toUpperCase();
    let b = document.getElementById(id);

    // Capture i for the closures
    let keyNum = i;

    b.addEventListener("mousedown", () => { pressKey(keyNum); }, false);
    b.addEventListener("mouseup", () => { releaseKey(keyNum); }, false);
}

// Set up keyboard
let keyMappings = {
    '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
    'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
    'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
    'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF,
}

document.addEventListener('keydown', (e) => {
    if (!e.repeat) {
        pressKey(keyMappings[e.key]);
    }
});

document.addEventListener('keyup', (e) => {
    releaseKey(keyMappings[e.key]);
});

var c = document.getElementById("displayCanvas");
var display_ctx = c.getContext("2d");

var chip8 = new Chip8();
var running = false;
runInterpreter();

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
    // If running, stop
    running = false;

    var fileInput = document.getElementById("rominput");

    var files = fileInput.files;
    for (var i = 0; i < files.length; i++) {
        let file = files[i];

        let reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = function () {
            chip8 = new Chip8();
            let data = new Uint8Array(reader.result);
            chip8.load_rom(data);
            running = true;
        };

        reader.onerror = function () {
            console.log(reader.error);
        };
    }
}

var decompile = {}

function runInterpreter() {
    if (!running) {
        setTimeout(runInterpreter, 100);
        return;
    }

    // Run 9 cycles for approx 500Hz clock speed
    for (var i = 0; i < 9; i++) {
        let pc = chip8.program_counter;
        let result = chip8.step();
        if (result) {
            decompile[`0x${pc.toString(16)}`] = result;
        }
    }

    // Draw frame
    let content = chip8.display;
    for (var j = 0; j < 32; j++) {
        for (var i = 0; i < 64; i++) {
            if (content[i][j]) {
                display_ctx.fillStyle = 'black';
            } else {
                display_ctx.fillStyle = 'white';
            }
            display_ctx.fillRect(i * 10, j * 10, 10, 10);
        }
    }

    // Decrement at 60Hz
    chip8.decrement_timers();

    var decompilation = "";
    Object.keys(decompile).sort().reduce(function (result, key) {
        decompilation += `${key}: ${decompile[key]}\n`
    }, {});
    document.getElementById("decompile").textContent = decompilation;

    setTimeout(runInterpreter, 1000 / 60);
}