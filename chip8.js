class Chip8 {
    constructor() {
        this.memory = { "a": "b" };
        this.registers = {};
        this.registerI = 0;

        // Clock speed 500hz
        // Decrement timers at 60hz
        this.delay_timer = 0;
        this.sound_timer = 0;

        this.display_width = 64;
        this.display_height = 32;
        this.clear_display();

        this.pc = 0x200;
        this.sp = 0;
        this.stack = {};
        this.keys = {};

        this.waiting_for_key = false;

        // Load character sprites into memory
        this.load_memory(0x0000, [
            // 0
            0xF0, 0x90, 0x90, 0x90, 0xF0,

            // 1
            0x20, 0x60, 0x20, 0x20, 0x70,

            // 2
            0x20, 0x60, 0x20, 0x20, 0x70,

            // 3
            0xF0, 0x10, 0xF0, 0x10, 0xF0,

            // 4
            0x90, 0x90, 0xF0, 0x10, 0x10,

            // 5
            0xF0, 0x80, 0xF0, 0x10, 0xF0,

            // 6
            0xF0, 0x80, 0xF0, 0x90, 0xF0,

            // 7
            0xF0, 0x10, 0x20, 0x40, 0x40,

            // 8
            0xF0, 0x90, 0xF0, 0x90, 0xF0,

            // 9
            0xF0, 0x90, 0xF0, 0x10, 0xF0,

            // A
            0xF0, 0x90, 0xF0, 0x90, 0x90,

            // B
            0xE0, 0x90, 0xE0, 0x90, 0xE0,

            // C
            0xF0, 0x80, 0x80, 0x80, 0xF0,

            // D
            0xE0, 0x90, 0x90, 0x90, 0xE0,

            // E
            0xF0, 0x80, 0xF0, 0x80, 0xF0,

            // F
            0xF0, 0x80, 0xF0, 0x80, 0x80,
        ])
    }

    get mem() {
        return this.memory;
    }

    // display returns the contents of the display
    get display() {
        return this.display_content;
    }

    get I() {
        return this.registerI & 0xFFFF;
    }

    load_memory(pos, data) {
        data.forEach((element, index) => this.memory[pos + index] = element);
    }

    load_rom(data) {
        let pos = 0x200;
        data.forEach((element, index) => this.memory[pos + index] = element);
    }

    setKey(key, value) {
        if (value) {
            if (this.waiting_for_key) {
                console.log("Will resume");
            }
            this.waiting_for_key = false;
        }
        this.keys[key] = value;
    }

    get program_counter() {
        return this.pc
    }

    register(id) {
        let value = this.registers[id];
        if (value == void (0)) {
            return 0
        }
        return value & 0xFF;
    }

    mem8(pos) {
        let value = this.memory[pos];
        if (value == void (0)) {
            return 0
        }
        return value & 0xFF;
    }

    mem16(pos) {
        let high = this.mem8(pos);
        let low = this.mem8(pos + 1);
        return (high << 8) + low;
    }

    decrement_timers() {
        if (this.sound_timer > 0) {
            this.sound_timer--;
            console.log("BEEP");
        }
        if (this.delay_timer > 0) {
            this.delay_timer--;
        }
    }

    clear_display() {
        this.display_content = Array.from(Array(this.display_width), () => new Array(this.display_height));
        for (var i = 0; i < this.display_width; i++) {
            for (var j = 0; j < this.display_height; j++) {
                this.display_content[i][j] = false;
            }
        }
    }

    step() {
        // Skip execution if waiting for a keypress
        if (this.waiting_for_key) {
            return;
        }

        // Load instruction
        let instruction = this.mem16(this.pc)
        this.pc += 2;

        // Execute instruction
        switch (instruction & 0xF000) {
            case 0x0000:
                this.instr0(instruction);
                break;
            case 0x1000:
                this.instr1(instruction);
                break;
            case 0x2000:
                this.instr2(instruction);
                break;
            case 0x3000:
                this.instr3(instruction);
                break;
            case 0x4000:
                this.instr4(instruction);
                break;
            case 0x5000:
                this.instr5(instruction);
                break;
            case 0x6000:
                this.instr6(instruction);
                break;
            case 0x7000:
                this.instr7(instruction);
                break;
            case 0x8000:
                this.instr8(instruction);
                break;
            case 0x9000:
                this.instr9(instruction);
                break;
            case 0xA000:
                this.instrA(instruction);
                break;
            case 0xB000:
                this.instrB(instruction);
                break;
            case 0xC000:
                this.instrC(instruction);
                break;
            case 0xD000:
                this.instrD(instruction);
                break;
            case 0xE000:
                this.instrE(instruction);
                break;
            case 0xF000:
                this.instrF(instruction);
                break;
        }
    }

    instr0(instruction) {
        if (instruction == 0x00E0) {
            // 00E0 - CLS
            // Clear the display.
            console.log("CLS");
            this.clear_display();
        }
        if (instruction == 0x00EE) {
            // 00EE - RET
            // Return from a subroutine.

            // The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
            console.log("RET");
            this.pc = this.stack[this.sp];
            this.sp--;
        }
    }

    // 1nnn - JP addr
    // Jump to location nnn.
    // The interpreter sets the program counter to nnn.
    instr1(instruction) {
        let addr = instruction & 0xFFF;
        console.log("JP 0x%s", addr.toString(16));
        this.pc = addr;
    }

    // 2nnn - CALL addr
    // Call subroutine at nnn.
    // The interpreter increments the stack pointer, 
    // then puts the current PC on the top of the stack. The PC is then set to nnn.
    instr2(instruction) {
        let addr = instruction & 0xFFF;
        console.log("CALL 0x%s", addr.toString(16));
        this.sp++;
        this.stack[this.sp] = this.pc;
        this.pc = addr;
    }

    // 3xkk - SE Vx, byte
    // Skip next instruction if Vx = kk.
    // The interpreter compares register Vx to kk, and if they are equal, 
    // increments the program counter by 2.
    instr3(instruction) {
        let value = instruction & 0xFF;
        let register = (instruction & 0xF00) >> 8;
        console.log("SE V%s, 0x%s", register.toString(16), value.toString(16));
        if (this.register(register) == value) {
            this.pc += 2;
        }
    }

    // 4xkk - SNE Vx, byte
    // Skip next instruction if Vx != kk.
    // The interpreter compares register Vx to kk, and if they are not equal, increments the program counter by 2.
    instr4(instruction) {
        let value = instruction & 0xFF;
        let register = (instruction & 0xF00) >> 8;
        console.log("SNE V%s, 0x%s", register.toString(16), value.toString(16));
        if (this.register(register) != value) {
            this.pc += 2;
        }
    }

    // 5xy0 - SE Vx, Vy
    // Skip next instruction if Vx = Vy.
    // The interpreter compares register Vx to register Vy, and if they are equal, increments the program counter by 2.
    instr5(instruction) {
        let register1 = (instruction & 0xF00) >> 8;
        let register2 = (instruction & 0xF0) >> 4;
        console.log("SE V%s, V%s", register1.toString(16), register2.toString(16));
        if (this.register(register1) == this.register(register2)) {
            this.pc += 2;
        }
    }

    // 6xkk - LD Vx, byte
    // Set Vx = kk.
    // The interpreter puts the value kk into register Vx.
    instr6(instruction) {
        let value = instruction & 0xFF;
        let register = (instruction & 0xF00) >> 8;
        console.log("LD V%s, 0x%s", register.toString(16), value.toString(16));
        this.registers[register] = value;
    }

    // 7xkk - ADD Vx, byte
    // Set Vx = Vx + kk.
    // Adds the value kk to the value of register Vx, then stores the result in Vx.
    instr7(instruction) {
        let value = instruction & 0xFF;
        let register = (instruction & 0xF00) >> 8;
        console.log("ADD V%s, 0x%s", register.toString(16), value.toString(16));
        this.registers[register] = this.register(register) + value;
    }

    instr8(instruction) {
        let x = (instruction & 0xF00) >> 8;
        let y = (instruction & 0xF0) >> 4;
        let vx = this.register(x);
        let vy = this.register(y);

        switch (instruction & 0xF) {
            // 8xy0 - LD Vx, Vy
            // Set Vx = Vy.
            // Stores the value of register Vy in register Vx.
            case 0x0:
                console.log("LD V%s, V%s", x.toString(16), y.toString(16));
                this.registers[x] = this.register(y);
                break;

            // 8xy1 - OR Vx, Vy
            // Set Vx = Vx OR Vy.
            // Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. A bitwise OR compares the corrseponding bits from two values, and if either bit is 1, then the same bit in the result is also 1. Otherwise, it is 0.
            case 0x1:
                console.log("OR V%s, V%s", x.toString(16), y.toString(16));
                this.registers[x] = this.register(x) | this.register(y);
                break;

            // 8xy2 - AND Vx, Vy
            // Set Vx = Vx AND Vy.
            // Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx. A bitwise AND compares the corrseponding bits from two values, and if both bits are 1, then the same bit in the result is also 1. Otherwise, it is 0.
            case 0x2:
                console.log("AND V%s, V%s", x.toString(16), y.toString(16));
                this.registers[x] = this.register(x) & this.register(y);
                break;

            // 8xy3 - XOR Vx, Vy
            // Set Vx = Vx XOR Vy.
            // Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx. An exclusive OR compares the corrseponding bits from two values, and if the bits are not both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0.
            case 0x3:
                console.log("XOR V%s, V%s", x.toString(16), y.toString(16));
                this.registers[x] = this.register(x) ^ this.register(y);
                break;

            // 8xy4 - ADD Vx, Vy
            // Set Vx = Vx + Vy, set VF = carry.
            // The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0. Only the lowest 8 bits of the result are kept, and stored in Vx.
            case 0x4:
                console.log("ADD V%s, V%s", x.toString(16), y.toString(16));
                let value = this.register(x) + this.register(y);
                this.registers[0xF] = value > 255 ? 1 : 0;
                this.registers[x] = value & 0xFF;
                break;

            // 8xy5 - SUB Vx, Vy
            // Set Vx = Vx - Vy, set VF = NOT borrow.
            // If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
            case 0x5:
                console.log("SUB V%s, V%s", x.toString(16), y.toString(16));
                this.registers[0xF] = vx > vy ? 1 : 0;
                this.registers[x] = vx - vy;
                break;

            // 8xy6 - SHR Vx {, Vy}
            // Set Vx = Vx SHR 1.
            // If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
            case 0x6:
                console.log("SHR V%s {, V%s}", x.toString(16), y.toString(16));
                this.registers[0xF] = (vx & 0x1) == 1 ? 1 : 0;
                this.registers[x] = vx >> 1;
                break;

            // 8xy7 - SUBN Vx, Vy
            // Set Vx = Vy - Vx, set VF = NOT borrow.
            // If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
            case 0x7:
                console.log("SUBN V%s, V%s", x.toString(16), y.toString(16));
                this.registers[0xF] = vy > vx ? 1 : 0;
                this.registers[x] = vy - vx;
                break;

            // 8xyE - SHL Vx {, Vy}
            // Set Vx = Vx SHL 1.
            // If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.
            case 0xE:
                console.log("SHL V%s {, V%s}", x.toString(16), y.toString(16));
                let shifted = vx << 1;
                this.registers[0xF] = shifted > 0xFF ? 1 : 0;
                this.registers[x] = shifted & 0xFF;
                break;
        }
    }

    // 9xy0 - SNE Vx, Vy
    // Skip next instruction if Vx != Vy.
    // The values of Vx and Vy are compared, and if they are not equal, 
    // the program counter is increased by 2.
    instr9(instruction) {
        let x = (instruction & 0xF00) >> 8;
        let y = (instruction & 0xF0) >> 4;
        console.log("SNE V%s, V%s", x.toString(16), y.toString(16));
        let vx = this.register(x);
        let vy = this.register(y);

        if (vx != vy) {
            this.pc += 2
        }
    }

    // Annn - LD I, addr
    // Set I = nnn.
    // The value of register I is set to nnn.
    instrA(instruction) {
        let addr = instruction & 0xFFF;
        console.log("LD I, 0x%s", addr.toString(16));
        this.registerI = addr;
    }

    // Bnnn - JP V0, addr
    // Jump to location nnn + V0.
    // The program counter is set to nnn plus the value of V0.
    instrB(instruction) {
        let addr = instruction & 0xFFF;
        console.log("LD I, 0x%s", addr.toString(16));
        this.pc = this.register(0x0) + (addr);
    }

    // Cxkk - RND Vx, byte
    // Set Vx = random byte AND kk.
    // The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk. The results are stored in Vx. See instruction 8xy2 for more information on AND.
    instrC(instruction) {
        let register = (instruction & 0xF00) >> 8;
        let kk = instruction & 0xFF;
        console.log("RND V%s, 0x%s", register.toString(16), kk.toString(16));
        this.registers[register] = (Math.random() * 255) & kk;
    }

    // Dxyn - DRW Vx, Vy, nibble
    // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
    // The interpreter reads n bytes from memory, starting at the address stored in I. 
    // These bytes are then displayed as sprites on screen at coordinates (Vx, Vy). 
    // Sprites are XORed onto the existing screen.
    // If this causes any pixels to be erased, VF is set to 1, otherwise it is set to 0. 
    // If the sprite is positioned so part of it is outside the coordinates of the display, 
    // it wraps around to the opposite side of the screen. 
    instrD(instruction) {
        let sprite_height = instruction & 0xF;
        let x = (instruction & 0xF00) >> 8;
        let y = (instruction & 0xF0) >> 4;
        let vx = this.register(x);
        let vy = this.register(y);

        console.log("DRW V%d, V%d, %d", x, y, sprite_height);
        console.log("Drawing a %d high sprite to (%d,%d)", sprite_height, vx, vy)

        this.registers[0xF] = 0;
        for (var yline = 0; yline < sprite_height; yline++) {
            let pos = this.I + yline;
            let spriteLine = this.mem8(pos);
            for (var xline = 0; xline < 8; xline++) {
                let spriteValue = ((spriteLine >> (7 - xline)) & 0x1) != 0;

                let xpos = (vx + xline) % this.display_width;
                let ypos = (vy + yline) % this.display_height;

                var curValue = this.display_content[xpos][ypos];
                if (spriteValue && (spriteValue == curValue)) {
                    this.display_content[xpos][ypos] = false;
                    this.registers[0xF] = 1;
                } else {
                    this.display_content[xpos][ypos] = spriteValue || curValue;
                }
            }
        }
    }

    instrE(instruction) {
        let x = (instruction & 0xF00) >> 8;
        let vx = this.register(x);
        switch (instruction & 0xFF) {
            // Ex9E - SKP Vx
            // Skip next instruction if key with the value of Vx is pressed.
            // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the down position, 
            // PC is increased by 2.
            case 0x9E:
                console.log("SKP V%s", x.toString(16));
                if (this.keys[vx]) {
                    this.pc += 2;
                }
                break;

            // ExA1 - SKNP Vx
            // Skip next instruction if key with the value of Vx is not pressed.
            // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.
            case 0xA1:
                console.log("SKNP V%s", x.toString(16));
                if (!this.keys[vx]) {
                    this.pc += 2;
                }
                break;
        }
    }

    instrF(instruction) {
        let x = (instruction & 0xF00) >> 8;
        let vx = this.register(x);
        switch (instruction & 0xFF) {
            // Fx07 - LD Vx, DT
            // Set Vx = delay timer value.
            // The value of DT is placed into Vx.
            case 0x07:
                console.log("LD V%s DT", x.toString(16));
                this.registers[x] = this.delay_timer;
                break;

            // Fx0A - LD Vx, K
            // Wait for a key press, store the value of the key in Vx.
            // All execution stops until a key is pressed, then the value of that key is stored in Vx.
            case 0x0A:
                console.log("LD V%s, K", x.toString(16));
                this.waiting_for_key = true;
                break;

            // Fx15 - LD DT, Vx
            // Set delay timer = Vx.
            // DT is set equal to the value of Vx.
            case 0x15:
                console.log("LD DT, V%s", x.toString(16));
                this.delay_timer = vx;
                break;

            // Fx18 - LD ST, Vx
            // Set sound timer = Vx.
            // ST is set equal to the value of Vx.
            case 0x18:
                console.log("LD ST, V%s", x.toString(16));
                this.sound_timer = vx;
                break;

            // Fx1E - ADD I, Vx
            // Set I = I + Vx.
            // The values of I and Vx are added, and the results are stored in I.
            case 0x1E:
                console.log("ADD I, V%s", x.toString(16));
                this.registerI = this.I + vx;
                break;

            // Fx29 - LD F, Vx
            // Set I = location of sprite for digit Vx.
            // The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx. 
            case 0x29:
                console.log("LD F, V%s", x.toString(16));
                this.registerI = 5 * vx
                break;

            // Fx33 - LD B, Vx
            // Store BCD representation of Vx in memory locations I, I+1, and I+2.
            // The interpreter takes the decimal value of Vx, 
            // and places the hundreds digit in memory at location in I, 
            // the tens digit at location I+1, and the ones digit at location I+2.
            case 0x33:
                console.log("LD B, V%s", x.toString(16));
                let i = this.I;
                let hundreds = Math.trunc(vx / 100);
                let tens = Math.trunc((vx % 100) / 10);
                let units = vx % 10;
                this.memory[i] = hundreds;
                this.memory[i + 1] = tens;
                this.memory[i + 2] = units;
                break;

            // Fx55 - LD [I], Vx
            // Store registers V0 through Vx in memory starting at location I.
            // The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.
            case 0x55:
                console.log("LD [I], V%s", x.toString(16));
                for (var c = 0; c < x; c++) {
                    this.memory[this.I + c] = this.register(c);
                }
                break;

            // Fx65 - LD Vx, [I]
            // Read registers V0 through Vx from memory starting at location I.
            // The interpreter reads values from memory starting at location I into registers V0 through Vx.
            case 0x65:
                console.log("LD V%s, [I]", x.toString(16));
                for (c = 0; c < x; c++) {
                    this.registers[c] = this.mem8(this.I + c);
                }
                break;
        }
    }
}

export default Chip8;