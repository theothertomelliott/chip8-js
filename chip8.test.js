import Chip8 from "./chip8.js"

test('init set up character sprites', () => {
    var vm = new Chip8();
    expect(vm.mem8(0x9)).toBe(0x70);
});

test('empty memory positions return 0', () => {
    var vm = new Chip8();
    expect(vm.mem8(0x201)).toBe(0x0);
});

test('retrieve 16-bits of memory', () => {
    var vm = new Chip8();
    expect(vm.mem16(0x8)).toBe(0x2070);
    expect(vm.mem16(0x201)).toBe(0x0000);
});

test('jp', () => {
    var vm = new Chip8();
    vm.load_rom([0x12, 0x04])
    vm.step()
    expect(vm.program_counter).toBe(0x204);
});

test('call and ret', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x22, 0x04,
        0x00, 0x00,
        0x00, 0xEE
    ])
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x202);
});

test('set register value', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x23,
    ])
    vm.step();
    expect(vm.register(1)).toBe(0x23);
});

test('compare register == value', () => {
    // true
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x23,
        0x31, 0x23,
    ])
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x206);

    // false
    vm = new Chip8();
    vm.load_rom([
        0x61, 0x23,
        0x31, 0x24,
    ])
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x204);
});

test('compare register != value', () => {
    // true
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x23,
        0x41, 0x24,
    ])
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x206);

    // false
    vm = new Chip8();
    vm.load_rom([
        0x61, 0x23,
        0x41, 0x23,
    ])
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x204);
});

test('compare register == register', () => {
    // true
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x23,
        0x62, 0x23,
        0x51, 0x20,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x208);

    // false
    vm = new Chip8();
    vm.load_rom([
        0x61, 0x23,
        0x62, 0x24,
        0x51, 0x20,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x206);
});

test('add to register', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x02,
        0x71, 0x03,
    ])
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x05);
});

test('Set Vx = Vy', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x02,
        0x62, 0x05,
        0x81, 0x20,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x05);
});

test('Set Vx = Vx OR Vy', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x0F,
        0x62, 0xF0,
        0x81, 0x21,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0xFF);
});

test('Set Vx = Vx AND Vy', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0xFF,
        0x62, 0x0F,
        0x81, 0x22,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x0F);
});

test('Set Vx = Vx XOR Vy', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0xFF,
        0x62, 0x0F,
        0x81, 0x23,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x0F0);
});

test('Set Vx = Vx + Vy, set VF = carry', () => {
    // with carry
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0xFF,
        0x62, 0x02,
        0x81, 0x24,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x01);
    expect(vm.register(0xF)).toBe(0x1);

    // no carry
    vm = new Chip8();
    vm.load_rom([
        0x61, 0x0F,
        0x62, 0x02,
        0x81, 0x24,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x11);
    expect(vm.register(0xF)).toBe(0x0);
});

test('Set Vx = Vx - Vy, set VF = NOT borrow', () => {
    // borrow
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x01,
        0x62, 0x02,
        0x81, 0x25,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0xFF);
    expect(vm.register(0xF)).toBe(0x0);

    // no borrow
    vm = new Chip8();
    vm.load_rom([
        0x61, 0x02,
        0x62, 0x01,
        0x81, 0x25,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x1);
    expect(vm.register(0xF)).toBe(0x1);
});

test('Set Vx = Vx SHR 1', () => {
    // borrow
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x03,
        0x81, 0x06,
    ])
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x1);
    expect(vm.register(0xF)).toBe(0x1);

    // no borrow
    vm = new Chip8();
    vm.load_rom([
        0x61, 0x02,
        0x81, 0x06,
    ])
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x1);
    expect(vm.register(0xF)).toBe(0x0);
});

test('Set Vx = Vy - Vx, set VF = NOT borrow', () => {
    // borrow
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x02,
        0x62, 0x01,
        0x81, 0x27,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0xFF);
    expect(vm.register(0xF)).toBe(0x0);

    // no borrow
    vm = new Chip8();
    vm.load_rom([
        0x61, 0x01,
        0x62, 0x02,
        0x81, 0x27,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x1);
    expect(vm.register(0xF)).toBe(0x1);
});

test('Set Vx = Vx SHL 1', () => {
    // carry
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x80,
        0x81, 0x0E,
    ])
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x0);
    expect(vm.register(0xF)).toBe(0x1);

    // no carry
    vm = new Chip8();
    vm.load_rom([
        0x61, 0x40,
        0x81, 0x0E,
    ])
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x80);
    expect(vm.register(0xF)).toBe(0x0);
});

test('SNE Vx, Vy', () => {
    // false
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x23,
        0x62, 0x23,
        0x91, 0x20,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x206);

    // true
    vm = new Chip8();
    vm.load_rom([
        0x61, 0x23,
        0x62, 0x24,
        0x91, 0x20,
    ])
    vm.step();
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x208);
});

test('LD I, addr', () => {
    var vm = new Chip8();
    vm.load_rom([
        0xA1, 0x23,
    ])
    vm.step();
    expect(vm.I).toBe(0x123);
});

test('JP V0, addr', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x60, 0x11,
        0xB1, 0x23,
    ])
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x134);
});

test('RND Vx, byte', () => {
    var vm = new Chip8();
    vm.load_rom([
        0xC1, 0x0F,
    ])
    vm.step();
    expect(vm.register(0x1) & 0xF0).toBe(0x0);
});

test('DRW Vx, Vy, nibble', () => {
    var vm = new Chip8();
    vm.load_rom([
        0xA2, 0x08, // LD I 0x208
        0xD1, 0x12, // DRW V1, V1, 2
        0xD1, 0x12, // DRW V1, V1, 2
        0x00, 0xE0, // CLS
        0xFF, 0xFF, // Sprite
    ]);
    vm.step();
    vm.step(); // Draw first sprite
    expect(vm.display[0][0]).toBe(true);
    expect(vm.display[0][1]).toBe(true);
    expect(vm.display[7][0]).toBe(true);
    expect(vm.display[7][1]).toBe(true);
    expect(vm.register(0xF)).toBe(0x0);

    vm.step(); // Draw second sprite, collision!
    expect(vm.display[0][0]).toBe(false);
    expect(vm.display[0][1]).toBe(false);
    expect(vm.display[7][0]).toBe(false);
    expect(vm.display[7][1]).toBe(false);
    expect(vm.register(0xF)).toBe(0x1);

    vm.step(); // Clear screen
    expect(vm.display[0][0]).toBe(false);
    expect(vm.display[0][1]).toBe(false);
    expect(vm.display[7][0]).toBe(false);
    expect(vm.display[7][1]).toBe(false);
});

test('SKP Vx', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x02, // LD V1 0x02
        0xE1, 0x9E, // SKP V1
        0x63, 0xFF, // LD V3 0xFF
        0xE1, 0x9E, // SKP V1
        0x64, 0xFF, // LD V4 0xFF
    ]);
    vm.step();
    vm.setKey(0x02, true);
    vm.step();
    vm.setKey(0x02, false);
    vm.step();
    vm.step();
    vm.step();

    expect(vm.register(0x3)).toBe(0x00);
    expect(vm.register(0x4)).toBe(0xFF);
});

test('SKNP Vx', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x02, // LD V1 0x02
        0xE1, 0xA1, // SKNP V1
        0x63, 0xFF, // LD V3 0xFF
        0xE1, 0xA1, // SKNP Vx
        0x64, 0xFF, // LD V4 0xFF
    ]);
    vm.step();
    vm.setKey(0x02, true);
    vm.step();
    vm.setKey(0x02, false);
    vm.step();
    vm.step();
    vm.step();

    expect(vm.register(0x3)).toBe(0xFF);
    expect(vm.register(0x4)).toBe(0x00);
});

test('LD DT, Vx,; decrement timers; LD Vx, DT', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0xF0, // LD V1 0xF0 (ensure this value is overwritten)
        0x61, 0x02, // LD V1 0x02
        0xF1, 0x15, // LD DT, V1
        0xF2, 0x07, // LD V1, DT
    ]);
    vm.step();
    vm.step();
    vm.step();
    vm.decrement_timers();
    vm.step();
    expect(vm.register(0x2)).toBe(0x01);
})