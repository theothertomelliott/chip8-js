import Chip8 from "./chip8.js"

document.getElementById("gobtn").addEventListener("click", loadROMAndStart, false);

var chip8 = new Chip8();
var display = document.getElementById("display");

function loadROMAndStart() {
    var fileInput = document.getElementById("rominput");

    // files is a FileList object (similar to NodeList)
    var files = fileInput.files;

    var file;

    for (var i = 0; i < files.length; i++) {
        file = files[i];

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
    setTimeout(runInterpreter, 10);
}