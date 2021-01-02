import React, { useRef, useEffect } from "react"
import ReactDOM from "react-dom"
import Chip8 from "./chip8.js"

class Root extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};

        this.fileChanged = this.fileChanged.bind(this);
    }

    fileChanged(ev) {
        let fileInput = ev.target;
        var files = fileInput.files;
        let _this = this;
        for (var i = 0; i < files.length; i++) {
            let file = files[i];

            let reader = new FileReader();
            reader.readAsArrayBuffer(file);

            reader.onload = function () {
                let data = new Uint8Array(reader.result);
                _this.setState({
                    data: data,
                });
            };

            reader.onerror = function () {
                console.log(reader.error);
            };
        }
    }

    render() {
        if (this.state.data) {
            // Show the game
            return <Run data={this.state.data} />;
        } else {
            return <input type="file" id="rominput" onChange={this.fileChanged} />;
        }
    }
}

class Run extends React.Component {
    constructor(props) {
        super(props);
        let chip8 = new Chip8();
        chip8.load_rom(props.data);

        this.state = {
            chip8: chip8,
            running: true,
            decompile: {},
        };

        this.runInterpreter = this.runInterpreter.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.runInterpreter(),
            1000 / 60
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    runInterpreter() {
        if (!this.state.running) {
            return;
        }

        let chip8 = this.state.chip8;
        let decompile = this.state.decompile;

        // Run 9 cycles for approx 500Hz clock speed
        for (var i = 0; i < 9; i++) {
            let pc = chip8.program_counter;
            let result = chip8.step();
            if (result) {
                decompile[pc] = result;
            }
        }

        // Decrement at 60Hz
        chip8.decrement_timers();

        this.setState({
            decompile: decompile,
        });
    }

    handleKeyDown(key) {
        this.state.chip8.setKey(key, true);
    }

    handleKeyUp(key) {
        this.state.chip8.setKey(key, false);
    }

    render() {
        return <div>
            <Display content={this.state.chip8.display} />
            <Keypad
                keyDown={this.handleKeyDown}
                keyUp={this.handleKeyUp}
            />
            <Decompile
                content={this.state.decompile}
                pc={this.state.chip8.program_counter}
            />
        </div>;
    }
}

class Keypad extends React.Component {
    render() {
        const keys = [
            [0x1, 0x2, 0x3, 0xC],
            [0x4, 0x5, 0x6, 0xD],
            [0x7, 0x8, 0x9, 0xE],
            [0xA, 0x0, 0xB, 0xF],
        ];
        const items = [];

        for (var i in keys) {
            for (var j in keys[i]) {
                let k = keys[i][j];
                items.push(<input
                    type="button"
                    onMouseDown={() => { this.props.keyDown(k) }}
                    onMouseUp={() => { this.props.keyUp(k) }}
                    key={"key" + k.toString(16)}
                    value={k.toString(16)}
                />);
            }
            items.push(<br key={"row" + i} />);
        }

        return <div>
            {items}
        </div >;
    }
}

class Decompile extends React.Component {
    render() {
        let decompile = this.props.content;
        let pc = this.props.pc;
        var items = [];
        Object.keys(decompile).sort().reduce(function (result, key) {
            if (key == pc) {
                items.push(<li key={key}><strong>0x{key.toString(16)}: {decompile[key]}</strong></li>);
            } else {
                items.push(<li key={key}>0x{key.toString(16)}: {decompile[key]}</li>);
            }
        }, {});

        return <ul>{items}</ul>;
    }
}

class Display extends React.Component {
    constructor(props) {
        super(props);
        this.canvas = React.createRef();

        this.draw = this.draw.bind(this);
    }

    componentDidMount() {
        this.draw();
    }

    draw() {
        const canvas = this.canvas.current;
        const context = canvas.getContext('2d')
        for (var j = 0; j < 32; j++) {
            for (var i = 0; i < 64; i++) {
                if (this.props.content[i][j]) {
                    context.fillStyle = 'white';
                } else {
                    context.fillStyle = 'black';
                }
                context.fillRect(i * 10, j * 10, 10, 10);
            }
        }

        setTimeout(this.draw, 1000 / 60);
    }

    render() {
        return <canvas
            ref={this.canvas}
            width={640} height={320}>
        </canvas>;
    }
}

export default Root;