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
})

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
})

test('set register value', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x23,
    ])
    vm.step();
    expect(vm.register(1)).toBe(0x23);
})

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
})

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
})

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
})

test('add to register', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x61, 0x02,
        0x71, 0x03,
    ])
    vm.step();
    vm.step();
    expect(vm.register(0x1)).toBe(0x05);
})

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
})

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
})

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
})

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
})

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
})

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
})

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
})

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
})

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
})

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
})

test('LD I, addr', () => {
    var vm = new Chip8();
    vm.load_rom([
        0xA1, 0x23,
    ])
    vm.step();
    expect(vm.I).toBe(0x123);
})

test('JP V0, addr', () => {
    var vm = new Chip8();
    vm.load_rom([
        0x60, 0x11,
        0xB1, 0x23,
    ])
    vm.step();
    vm.step();
    expect(vm.program_counter).toBe(0x134);
})