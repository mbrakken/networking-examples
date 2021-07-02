// prettier-ignore
const BYTES = {
  '00000000': 0x0,
  '00000001': 0x1,
  '00000010': 0x2,
  '00000011': 0x3,
  '00001000': 0x8,
  '00001001': 0x9,
  '00001010': 0xa,
  '00001111': 0xf,
  '00010000': 0x10,
  '00100000': 0x20,
  '01000000': 0x40,
  '01110000': 0x70,
  '01111111': 0x7f,
  '10000000': 0x80,
  '11111111': 0xff,
};

function interpretOpCode(code) {
  switch (code) {
    case 0x0:
      return 'CONTINUE';

    case 0x1:
      return 'TEXT';

    case 0x2:
      return 'BINARY';

    case 0x8:
      return 'CLOSE';

    case 0x9:
      return 'PING';

    case 0xa:
      return 'PONG';

    default:
      throw new Error('Unsupported opcode', code.toString(2));
  }
}

module.exports = {
  processFirstByte(message) {
    const firstByte = message.readUint8(0);

    // const finalFrame = Boolean((firstByte >>> 7) & 0x;
    // const [reserved1, reserved2, reserved3] = [
    //   Boolean((firstByte >>> 6) & 0x1),
    //   Boolean((firstByte >>> 5) & 0x1),
    //   Boolean((firstByte >>> 4) & 0x1),
    // ];

    return {
      final: (firstByte & 0x80) === 0x80,
      rsv1: (firstByte & 0x40) === 0x40,
      rsv2: (firstByte & 0x20) === 0x20,
      rsv2: (firstByte & 0x10) === 0x10,
      opcode: firstByte & 0xf,
    };
  },

  // https://medium.com/hackernoon/implementing-a-websocket-server-with-node-js-d9b78ec5ffa8
  parseIncomingMessage(message, firstByte) {
    console.debug('IS FINAL FRAME?', firstByte.final);

    if (firstByte.rsv1 || firstByte.rsv2 || firstByte.rsv3) {
      throw new Error('Extensions are not currently supported');
    }

    const opCodeMeaning = interpretOpCode(firstByte.opcode);

    console.debug(
      'OPCODE:',
      opCode.toString(2).padStart(4, '0'),
      opCodeMeaning
    );

    // We can return null to signify that this is a connection termination frame
    if (opCodeMeaning === 'CLOSE') {
      return null;
    }

    // We only care about text frames from this point onward
    if (opCodeMeaning !== 'TEXT') {
      return;
    }

    const secondByte = message.readUInt8(1);
    const isMasked = (secondByte & 0x80) === 0x80;
    // const isMasked = Boolean((secondByte >>> 7) & 0x1);

    if (!isMasked) {
      throw new Error('Messages from clients must be masked');
    }

    // Keep track of our current position as we advance through the buffer
    let byteOffset = 2;
    let payloadLength = secondByte & 0x7f;

    if (payloadLength > 125) {
      if (payloadLength === 126) {
        payloadLength = message.readUInt16BE(byteOffset);
        byteOffset += 2;
      } else {
        // 127
        // If this has a value, the frame size is ridiculously huge!
        const leftPart = message.readUInt32BE(byteOffset);
        const rightPart = message.readUInt32BE((byteOffset += 4));

        // Honestly, if the frame length requires 64 bits, you're probably doing it wrong.
        // In Node.js you'll require the BigInt type, or a special library to handle this.
        throw new Error('Large payloads not currently implemented.');
      }
    }

    const maskingKey = message.slice(byteOffset, (byteOffset += 4));

    const decoded = message
      .slice(byteOffset)
      .map((byte, idx) => byte ^ maskingKey[idx % 4]);

    return decoded.toString('utf8');
  },

  sendControlMessage(socket, buffer, firstByte) {},

  writeOutgoingMessage(text) {
    const messageByteLength = Buffer.byteLength(text);
    // Note: we're not supporting > 65535 byte payloads at this stage
    const lengthByteCount = messageByteLength < 126 ? 0 : 2;
    const payloadLength = lengthByteCount === 0 ? messageByteLength : 126;
    const buffer = Buffer.alloc(2 + lengthByteCount + messageByteLength);
    // Write out the first byte, using opcode `1` to indicate that the message
    // payload contains text data
    buffer.writeUInt8(0b10000001, 0);
    buffer.writeUInt8(payloadLength, 1);
    // Write the length of the JSON payload to the second byte
    let payloadOffset = 2;
    if (lengthByteCount > 0) {
      buffer.writeUInt16BE(messageByteLength, 2);
      payloadOffset += lengthByteCount;
    }
    // Write the JSON data to the data buffer
    buffer.write(text, payloadOffset);
    return buffer;
  },
};
