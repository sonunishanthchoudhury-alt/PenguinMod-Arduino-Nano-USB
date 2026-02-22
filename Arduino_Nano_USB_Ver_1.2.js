class ArduinoNanoUSB {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;

    this.analogValues = {};
    this.digitalValues = {};
    this.pulseValue = 0; // ADDED
    this.connected = false;
  }

  getInfo() {
    return {
      id: 'arduinoNanoUSB',
      name: 'Arduino Nano USB',

      color1: "#1381f9",
      color2: "#000000",
      color3: "#0000EE",

      blocks: [
        {
          opcode: 'connect',
          blockType: 'command',
          text: 'connect arduino'
        },
        {
          opcode: 'disconnect',
          blockType: 'command',
          text: 'disconnect arduino'
        },
        {
          opcode: 'isConnected',
          blockType: Scratch.BlockType.BOOLEAN,
          text: 'arduino connected?'
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

        // NEW BLOCK
        {
          opcode: 'readPulseIn',
          blockType: 'reporter',
          text: 'read pulse in pin [PIN]',
          arguments: {
            PIN: { type: 'number', defaultValue: 8 }
          }
        }
      ]
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

          // HANDLE PULSE RESPONSE
          if (line.startsWith('P')) {
            const parts = line.split(' ');
            this.pulseValue = Number(parts[1]);
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

    try {
      const cmd = `DW ${args.PIN} ${args.VALUE}\n`;
      await this.writer.write(new TextEncoder().encode(cmd));
    } catch (e) {
      console.warn("Write failed:", e);
      await this.safeDisconnect();
    }
  }

  digitalRead(args) {
    if (!this.connected || !this.writer) return 0;

    const pin = args.PIN;

    try {
      this.writer.write(
        new TextEncoder().encode(`DR ${pin}\n`)
      );
    } catch (e) {
      console.warn("Read request failed:", e);
      this.safeDisconnect();
      return 0;
    }

    return this.digitalValues[pin] ?? 0;
  }

  async setPWM(args) {
    if (!this.connected || !this.writer) return;

    try {
      const cmd = `PW ${args.PIN} ${args.VALUE}\n`;
      await this.writer.write(new TextEncoder().encode(cmd));
    } catch (e) {
      console.warn("Write failed:", e);
      await this.safeDisconnect();
    }
  }

  async setServo(args) {
    if (!this.connected || !this.writer) return;

    try {
      const cmd = `SW ${args.PIN} ${args.ANGLE}\n`;
      await this.writer.write(new TextEncoder().encode(cmd));
    } catch (e) {
      console.warn("Write failed:", e);
      await this.safeDisconnect();
    }
  }

  analogRead(args) {
    if (!this.connected || !this.writer) return 0;

    const pin = args.PIN;

    try {
      this.writer.write(
        new TextEncoder().encode(`AR ${pin}\n`)
      );
    } catch (e) {
      console.warn("Read request failed:", e);
      this.safeDisconnect();
      return 0;
    }

    return this.analogValues[pin] ?? 0;
  }

  // NEW FUNCTION
  readPulseIn(args) {
    if (!this.connected || !this.writer) return 0;

    const pin = args.PIN;

    try {
      this.writer.write(
        new TextEncoder().encode(`PI ${pin}\n`)
      );
    } catch (e) {
      console.warn("Pulse request failed:", e);
      this.safeDisconnect();
      return 0;
    }

    return this.pulseValue ?? 0;
  }
}

Scratch.extensions.register(new ArduinoNanoUSB());
