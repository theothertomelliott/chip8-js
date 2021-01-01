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
        this.store_key_in = 0x0;

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
                console.log("Will resume with key 0x%s", key.toString(16));
                this.registers[this.store_key_in] = key;
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
            return false;
        }

        // Load instruction
        let instruction = this.mem16(this.pc)
        this.pc += 2;

        // Execute instruction
        switch (instruction & 0xF000) {
            case 0x0000:
                return this.instr0(instruction);
            case 0x1000:
                return this.instr1(instruction);
            case 0x2000:
                return this.instr2(instruction);
            case 0x3000:
                return this.instr3(instruction);
            case 0x4000:
                return this.instr4(instruction);
            case 0x5000:
                return this.instr5(instruction);
            case 0x6000:
                return this.instr6(instruction);
            case 0x7000:
                return this.instr7(instruction);
            case 0x8000:
                return this.instr8(instruction);
            case 0x9000:
                return this.instr9(instruction);
            case 0xA000:
                return this.instrA(instruction);
            case 0xB000:
                return this.instrB(instruction);
            case 0xC000:
                return this.instrC(instruction);
            case 0xD000:
                return this.instrD(instruction);
            case 0xE000:
                return this.instrE(instruction);
            case 0xF000:
                return this.instrF(instruction);
        }
    }

    instr0(instruction) {
        if (instruction == 0x00E0) {
            // 00E0 - CLS
            // Clear the display.
            this.clear_display();
            return `CLS`;
        }
        if (instruction == 0x00EE) {
            // 00EE - RET
            // Return from a subroutine.

            // The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
            this.pc = this.stack[this.sp];
            this.sp--;
            return `RET`;
        }
    }

    // 1nnn - JP addr
    // Jump to location nnn.
    // The interpreter sets the program counter to nnn.
    instr1(instruction) {
        let addr = instruction & 0xFFF;
        this.pc = addr;
        return `JP 0x${addr.toString(16)}`;
    }

    // 2nnn - CALL addr
    // Call subroutine at nnn.
    // The interpreter increments the stack pointer, 
    // then puts the current PC on the top of the stack. The PC is then set to nnn.
    instr2(instruction) {
        let addr = instruction & 0xFFF;
        this.sp++;
        this.stack[this.sp] = this.pc;
        this.pc = addr;
        return `CALL 0x${addr.toString(16)}`;
    }

    // 3xkk - SE Vx, byte
    // Skip next instruction if Vx = kk.
    // The interpreter compares register Vx to kk, and if they are equal, 
    // increments the program counter by 2.
    instr3(instruction) {
        let value = instruction & 0xFF;
        let register = (instruction & 0xF00) >> 8;
        if (this.register(register) == value) {
            this.pc += 2;
        }
        return `SE V${register.toString(16)}, 0x${value.toString(16)}`;
    }

    // 4xkk - SNE Vx, byte
    // Skip next instruction if Vx != kk.
    // The interpreter compares register Vx to kk, and if they are not equal, increments the program counter by 2.
    instr4(instruction) {
        let value = instruction & 0xFF;
        let register = (instruction & 0xF00) >> 8;
        if (this.register(register) != value) {
            this.pc += 2;
        }
        return `SNE V${register.toString(16)}, 0x${value.toString(16)}`;
    }

    // 5xy0 - SE Vx, Vy
    // Skip next instruction if Vx = Vy.
    // The interpreter compares register Vx to register Vy, and if they are equal, increments the program counter by 2.
    instr5(instruction) {
        let register1 = (instruction & 0xF00) >> 8;
        let register2 = (instruction & 0xF0) >> 4;
        if (this.register(register1) == this.register(register2)) {
            this.pc += 2;
        }
        return `SE V${register1.toString(16)}, V${register2.toString(16)}`;
    }

    // 6xkk - LD Vx, byte
    // Set Vx = kk.
    // The interpreter puts the value kk into register Vx.
    instr6(instruction) {
        let value = instruction & 0xFF;
        let register = (instruction & 0xF00) >> 8;
        this.registers[register] = value;
        return `LD V${register.toString(16)}, 0x${value.toString(16)}`;
    }

    // 7xkk - ADD Vx, byte
    // Set Vx = Vx + kk.
    // Adds the value kk to the value of register Vx, then stores the result in Vx.
    instr7(instruction) {
        let value = instruction & 0xFF;
        let register = (instruction & 0xF00) >> 8;
        this.registers[register] = this.register(register) + value;
        return `ADD V${register.toString(16)}, 0x${value.toString(16)}`;
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
                this.registers[x] = this.register(y);
                return `LD V${x.toString(16)}, V${y.toString(16)}`;

            // 8xy1 - OR Vx, Vy
            // Set Vx = Vx OR Vy.
            // Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. A bitwise OR compares the corrseponding bits from two values, and if either bit is 1, then the same bit in the result is also 1. Otherwise, it is 0.
            case 0x1:
                this.registers[x] = this.register(x) | this.register(y);
                return `OR V${x.toString(16)}, V${y.toString(16)}`;

            // 8xy2 - AND Vx, Vy
            // Set Vx = Vx AND Vy.
            // Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx. A bitwise AND compares the corrseponding bits from two values, and if both bits are 1, then the same bit in the result is also 1. Otherwise, it is 0.
            case 0x2:
                this.registers[x] = this.register(x) & this.register(y);
                return `AND V${x.toString(16)}, V${y.toString(16)}`;

            // 8xy3 - XOR Vx, Vy
            // Set Vx = Vx XOR Vy.
            // Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx. An exclusive OR compares the corrseponding bits from two values, and if the bits are not both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0.
            case 0x3:
                this.registers[x] = this.register(x) ^ this.register(y);
                return `XOR V${x.toString(16)}, V${y.toString(16)}`;

            // 8xy4 - ADD Vx, Vy
            // Set Vx = Vx + Vy, set VF = carry.
            // The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0. Only the lowest 8 bits of the result are kept, and stored in Vx.
            case 0x4:
                let value = this.register(x) + this.register(y);
                this.registers[0xF] = value > 255 ? 1 : 0;
                this.registers[x] = value & 0xFF;
                return `ADD V${x.toString(16)}, V${y.toString(16)}`;

            // 8xy5 - SUB Vx, Vy
            // Set Vx = Vx - Vy, set VF = NOT borrow.
            // If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
            case 0x5:
                this.registers[0xF] = vx > vy ? 1 : 0;
                this.registers[x] = vx - vy;
                return `SUB V${x.toString(16)}, V${y.toString(16)}`;

            // 8xy6 - SHR Vx {, Vy}
            // Set Vx = Vx SHR 1.
            // If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
            case 0x6:
                this.registers[0xF] = (vx & 0x1) == 1 ? 1 : 0;
                this.registers[x] = vx >> 1;
                return `SHR V${x.toString(16)} {, V${y.toString(16)}}`;

            // 8xy7 - SUBN Vx, Vy
            // Set Vx = Vy - Vx, set VF = NOT borrow.
            // If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
            case 0x7:
                this.registers[0xF] = vy > vx ? 1 : 0;
                this.registers[x] = vy - vx;
                return `SUBN V${x.toString(16)}, V${y.toString(16)}`;

            // 8xyE - SHL Vx {, Vy}
            // Set Vx = Vx SHL 1.
            // If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.
            case 0xE:
                let shifted = vx << 1;
                this.registers[0xF] = shifted > 0xFF ? 1 : 0;
                this.registers[x] = shifted & 0xFF;
                return `SHL V${x.toString(16)} {, V${y.toString(16)}}`;
        }
    }

    // 9xy0 - SNE Vx, Vy
    // Skip next instruction if Vx != Vy.
    // The values of Vx and Vy are compared, and if they are not equal, 
    // the program counter is increased by 2.
    instr9(instruction) {
        let x = (instruction & 0xF00) >> 8;
        let y = (instruction & 0xF0) >> 4;
        let vx = this.register(x);
        let vy = this.register(y);

        if (vx != vy) {
            this.pc += 2
        }

        return `SNE V${x.toString(16)}, V${y.toString(16)}`;
    }

    // Annn - LD I, addr
    // Set I = nnn.
    // The value of register I is set to nnn.
    instrA(instruction) {
        let addr = instruction & 0xFFF;
        this.registerI = addr;
        return `LD I, 0x${addr.toString(16)}`;
    }

    // Bnnn - JP V0, addr
    // Jump to location nnn + V0.
    // The program counter is set to nnn plus the value of V0.
    instrB(instruction) {
        let addr = instruction & 0xFFF;
        this.pc = this.register(0x0) + (addr);
        return `LD I, 0x${addr.toString(16)}`;
    }

    // Cxkk - RND Vx, byte
    // Set Vx = random byte AND kk.
    // The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk. The results are stored in Vx. See instruction 8xy2 for more information on AND.
    instrC(instruction) {
        let register = (instruction & 0xF00) >> 8;
        let kk = instruction & 0xFF;
        this.registers[register] = (Math.random() * 255) & kk;
        return `RND V${register.toString(16)}, 0x${kk.toString(16)}`;
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

        return `DRW V${x}, V${y}, ${sprite_height}`;
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
                if (this.keys[vx]) {
                    this.pc += 2;
                }
                return `SKP V${x.toString(16)}`;

            // ExA1 - SKNP Vx
            // Skip next instruction if key with the value of Vx is not pressed.
            // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.
            case 0xA1:
                if (!this.keys[vx]) {
                    this.pc += 2;
                }
                return `SKNP V${x.toString(16)}`;
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
                this.registers[x] = this.delay_timer;
                return `LD V${x.toString(16)} DT`;

            // Fx0A - LD Vx, K
            // Wait for a key press, store the value of the key in Vx.
            // All execution stops until a key is pressed, then the value of that key is stored in Vx.
            case 0x0A:
                this.waiting_for_key = true;
                this.store_key_in = x;
                return `LD V${x.toString(16)}`;

            // Fx15 - LD DT, Vx
            // Set delay timer = Vx.
            // DT is set equal to the value of Vx.
            case 0x15:
                this.delay_timer = vx;
                return `LD DT, V${x.toString(16)}`;

            // Fx18 - LD ST, Vx
            // Set sound timer = Vx.
            // ST is set equal to the value of Vx.
            case 0x18:
                this.sound_timer = vx;
                return `LD ST, V${x.toString(16)}`;

            // Fx1E - ADD I, Vx
            // Set I = I + Vx.
            // The values of I and Vx are added, and the results are stored in I.
            case 0x1E:
                this.registerI = this.I + vx;
                return `ADD I, V${x.toString(16)}`;

            // Fx29 - LD F, Vx
            // Set I = location of sprite for digit Vx.
            // The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx. 
            case 0x29:
                this.registerI = 5 * vx
                return `LD F, V${x.toString(16)}`;

            // Fx33 - LD B, Vx
            // Store BCD representation of Vx in memory locations I, I+1, and I+2.
            // The interpreter takes the decimal value of Vx, 
            // and places the hundreds digit in memory at location in I, 
            // the tens digit at location I+1, and the ones digit at location I+2.
            case 0x33:
                let i = this.I;
                let hundreds = Math.trunc(vx / 100);
                let tens = Math.trunc((vx % 100) / 10);
                let units = vx % 10;
                this.memory[i] = hundreds;
                this.memory[i + 1] = tens;
                this.memory[i + 2] = units;
                return `LD B, V${x.toString(16)}`;

            // Fx55 - LD [I], Vx
            // Store registers V0 through Vx in memory starting at location I.
            // The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.
            case 0x55:
                for (var c = 0; c < x; c++) {
                    this.memory[this.I + c] = this.register(c);
                }
                return `LD [I], V${x.toString(16)}`;

            // Fx65 - LD Vx, [I]
            // Read registers V0 through Vx from memory starting at location I.
            // The interpreter reads values from memory starting at location I into registers V0 through Vx.
            case 0x65:
                for (c = 0; c < x; c++) {
                    this.registers[c] = this.mem8(this.I + c);
                }
                return `LD V${x.toString(16)}, [I]`;
        }
    }
}

export default Chip8;