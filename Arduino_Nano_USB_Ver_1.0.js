class ArduinoNanoUSB {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;

    this.analogValues = {};
    this.digitalValues = {}; // ✅ ADDED
    this.connected = false;
  }

  getInfo() {
    return {
      id: 'arduinoNanoUSB',
      name: 'Arduino Nano USB',
	  
	color1: "#1381f9",   // block fill
    color2: "#000000",   // block outline
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
          blockType: 'boolean',
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

        // ✅ NEW DIGITAL READ BLOCK
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
    try {
      this.connected = false;
      if (this.reader) await this.reader.cancel();
      if (this.writer) this.writer.releaseLock();
      if (this.port) await this.port.close();
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  }

  isConnected() {
    return this.connected;
  }

  async readLoop() {
    const decoder = new TextDecoder();
    let buffer = '';

    while (this.connected) {
      const { value, done } = await this.reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (let line of lines) {
        line = line.trim();

        // ANALOG REPLY: A pin value
        if (line.startsWith('A')) {
          const parts = line.split(' ');
          this.analogValues[Number(parts[1])] = Number(parts[2]);
        }

        // ✅ DIGITAL REPLY: D pin value
        if (line.startsWith('D')) {
          const parts = line.split(' ');
          this.digitalValues[Number(parts[1])] = Number(parts[2]);
        }
      }
    }
  }

  async digitalWrite(args) {
    if (!this.writer) return;
    const cmd = `DW ${args.PIN} ${args.VALUE}\n`; // ✅ FIXED COMMAND NAME
    await this.writer.write(new TextEncoder().encode(cmd));
  }

  // ✅ NEW DIGITAL READ FUNCTION
  digitalRead(args) {
    if (!this.writer) return 0;
    const pin = args.PIN;
    this.writer.write(
      new TextEncoder().encode(`DR ${pin}\n`)
    );
    return this.digitalValues[pin] ?? 0;
  }

  async setPWM(args) {
    if (!this.writer) return;
    const cmd = `PW ${args.PIN} ${args.VALUE}\n`;
    await this.writer.write(new TextEncoder().encode(cmd));
  }

  async setServo(args) {
    if (!this.writer) return;
    const cmd = `SW ${args.PIN} ${args.ANGLE}\n`;
    await this.writer.write(new TextEncoder().encode(cmd));
  }

  analogRead(args) {
    if (!this.writer) return 0;
    const pin = args.PIN;
    this.writer.write(
      new TextEncoder().encode(`AR ${pin}\n`)
    );
    return this.analogValues[pin] ?? 0;
  }
}

Scratch.extensions.register(new ArduinoNanoUSB());
