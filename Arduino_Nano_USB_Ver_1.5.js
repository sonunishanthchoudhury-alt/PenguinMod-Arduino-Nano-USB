class ArduinoNanoUSB {
  constructor() {
    if (typeof Scratch !== 'undefined' && Scratch.extensions.unsandboxed === false) {
      console.error("Arduino Nano USB Extension: Cannot run in sandbox mode.");
      throw new Error("Sandbox mode not supported");
    }

    this.port = null;
    this.reader = null;
    this.writer = null;

    this.analogValues = {};
    this.digitalValues = {};
    this.pulseValue = 0;
    this.connected = false;
    this.ultraDuration = 0;
  }

  getInfo() {
    return {
      id: 'arduinoNanoUSB',
      name: 'Arduino Nano USB',

      color1: "#1381f9",
      color2: "#000000",
      color3: "#0000EE",

      blocks: [
        { opcode: 'connect', blockType: 'command', text: 'connect arduino' },
        { opcode: 'disconnect', blockType: 'command', text: 'disconnect arduino' },
        { opcode: 'isConnected', blockType: Scratch.BlockType.BOOLEAN, text: 'arduino connected?' },

        {
          opcode: 'setPinMode',
          blockType: 'command',
          text: 'set pin [PIN] mode [MODE]',
          arguments: {
            PIN: { type: 'number', defaultValue: 2 },
            MODE: { type: 'string', menu: 'pinModes', defaultValue: 'INPUT' }
          }
        },

        {
          opcode: 'digitalWrite',
          blockType: 'command',
          text: 'set digital pin [PIN] to [VALUE]',
          arguments: {
            PIN: { type: 'number', defaultValue: 9 },
            VALUE: { type: 'number', defaultValue: 1 }
          }
        },
        {
          opcode: 'digitalRead',
          blockType: 'reporter',
          text: 'digital read pin [PIN]',
          arguments: {
            PIN: { type: 'number', defaultValue: 9 }
          }
        },
        {
          opcode: 'setPWM',
          blockType: 'command',
          text: 'set PWM pin [PIN] to value [VALUE]',
          arguments: {
            PIN: { type: 'number', defaultValue: 9 },
            VALUE: { type: 'number', defaultValue: 255 }
          }
        },
        {
          opcode: 'setServo',
          blockType: 'command',
          text: 'set servo [PIN] to angle [ANGLE]',
          arguments: {
            PIN: { type: 'number', defaultValue: 9 },
            ANGLE: { type: 'number', defaultValue: 90 }
          }
        },
        {
          opcode: 'analogRead',
          blockType: 'reporter',
          text: 'analog read [PIN]',
          arguments: {
            PIN: { type: 'number', defaultValue: 0 }
          }
        },
        {
          opcode: 'ultrasonicDistance',
          blockType: 'reporter',
          text: 'ultrasonic distance trig [TRIG] echo [ECHO]',
          arguments: {
            TRIG: { type: 'number', defaultValue: 2 },
            ECHO: { type: 'number', defaultValue: 4 }
          }
        },
        {
          opcode: 'readPulseIn',
          blockType: 'reporter',
          text: 'read pulse in pin [PIN]',
          arguments: {
            PIN: { type: 'number', defaultValue: 8 }
          }
        },
        {
          opcode: 'sendPulse',
          blockType: 'command',
          text: 'send pulse on pin [PIN] for [TIME] microseconds',
          arguments: {
            PIN: { type: 'number', defaultValue: 9 },
            TIME: { type: 'number', defaultValue: 1000 }
          }
        }
      ],

      menus: {
        pinModes: {
          acceptReporters: true,
          items: ['INPUT', 'OUTPUT', 'INPUT_PULLUP']
        }
      }
    };
  }

  async connect() {
    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 115200 });

      this.writer = this.port.writable.getWriter();
      this.reader = this.port.readable.getReader();

      this.connected = true;
      this.readLoop();
    } catch (e) {
      console.error('Connection failed:', e);
    }
  }

  async disconnect() {
    await this.safeDisconnect();
  }

  async safeDisconnect() {
    this.connected = false;

    try {
      if (this.reader) {
        try { await this.reader.cancel(); } catch {}
        try { this.reader.releaseLock(); } catch {}
        this.reader = null;
      }

      if (this.writer) {
        try { this.writer.releaseLock(); } catch {}
        this.writer = null;
      }

      if (this.port) {
        try { await this.port.close(); } catch {}
        this.port = null;
      }
    } catch (e) {
      console.warn("Safe disconnect error:", e);
    }
  }

  isConnected() {
    return this.connected;
  }

  async readLoop() {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (this.connected) {
        const { value, done } = await this.reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (let line of lines) {
          line = line.trim();

          if (line.startsWith('A')) {
            const parts = line.split(' ');
            this.analogValues[Number(parts[1])] = Number(parts[2]);
          }

          if (line.startsWith('D')) {
            const parts = line.split(' ');
            this.digitalValues[Number(parts[1])] = Number(parts[2]);
          }

          if (line.startsWith('P')) {
            const parts = line.split(' ');
            this.pulseValue = Number(parts[1]);
          }

          if (line.startsWith('U')) {
            const parts = line.split(' ');
            this.ultraDuration = Number(parts[1]);
          }
        }
      }
    } catch (error) {
      console.warn("Serial disconnected unexpectedly:", error);
    } finally {
      await this.safeDisconnect();
    }
  }

  async digitalWrite(args) {
    if (!this.connected || !this.writer) return;
    await this.writer.write(new TextEncoder().encode(`DW ${args.PIN} ${args.VALUE}\n`));
  }

  digitalRead(args) {
    if (!this.connected || !this.writer) return 0;
    this.writer.write(new TextEncoder().encode(`DR ${args.PIN}\n`));
    return this.digitalValues[args.PIN] ?? 0;
  }

  async setPWM(args) {
    if (!this.connected || !this.writer) return;
    await this.writer.write(new TextEncoder().encode(`PW ${args.PIN} ${args.VALUE}\n`));
  }

  async setServo(args) {
    if (!this.connected || !this.writer) return;
    await this.writer.write(new TextEncoder().encode(`SW ${args.PIN} ${args.ANGLE}\n`));
  }

  async setPinMode(args) {
    if (!this.connected || !this.writer) return;
    await this.writer.write(new TextEncoder().encode(`PM ${args.PIN} ${args.MODE}\n`));
  }

  analogRead(args) {
    if (!this.connected || !this.writer) return 0;
    this.writer.write(new TextEncoder().encode(`AR ${args.PIN}\n`));
    return this.analogValues[args.PIN] ?? 0;
  }

  async ultrasonicDistance(args) {
    if (!this.connected || !this.writer) return 0;
    await this.writer.write(new TextEncoder().encode(`US ${args.TRIG} ${args.ECHO}\n`));
    await new Promise(r => setTimeout(r, 30));
    return Math.round((this.ultraDuration ?? 0) / 58);
  }

  readPulseIn(args) {
    if (!this.connected || !this.writer) return 0;
    this.writer.write(new TextEncoder().encode(`PI ${args.PIN}\n`));
    return this.pulseValue ?? 0;
  }

  async sendPulse(args) {
    if (!this.connected || !this.writer) return;
    await this.writer.write(new TextEncoder().encode(`SP ${args.PIN} ${args.TIME}\n`));
  }
}

Scratch.extensions.register(new ArduinoNanoUSB());
