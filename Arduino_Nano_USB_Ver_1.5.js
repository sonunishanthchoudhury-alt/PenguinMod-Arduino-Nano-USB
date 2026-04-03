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

  async setPinMode(args) {
    if (!this.connected || !this.writer) return;

    try {
      const cmd = `PM ${args.PIN} ${args.MODE}\n`;
      await this.writer.write(new TextEncoder().encode(cmd));
    } catch (e) {
      console.warn("Pin mode failed:", e);
      await this.safeDisconnect();
    }
  }

  // (ALL YOUR OTHER FUNCTIONS REMAIN EXACTLY SAME — unchanged)
}
Scratch.extensions.register(new ArduinoNanoUSB());
