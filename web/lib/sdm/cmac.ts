export function hexToBuffer(hex: string): Buffer {
    return Buffer.from(hex, 'hex')
}

export function bufferToHex(buf: Buffer): string {
    return buf.toString('hex').toUpperCase()
}

// AES-CMAC simple implementation using crypto
import { createCipheriv } from 'node:crypto'

function bitShiftLeft(buffer: Buffer) {
    const shifted = Buffer.alloc(buffer.length);
    let overflow = 0;
    for (let i = buffer.length - 1; i >= 0; i--) {
        shifted[i] = (buffer[i] << 1) | overflow;
        overflow = (buffer[i] & 0x80) ? 1 : 0;
    }
    return shifted;
}

function xor(a: Buffer, b: Buffer) {
    const length = Math.min(a.length, b.length);
    const result = Buffer.alloc(length);
    for (let i = 0; i < length; i++) {
        result[i] = a[i] ^ b[i];
    }
    return result;
}

function generateSubkeys(key: Buffer) {
    const const_Rb = Buffer.from('00000000000000000000000000000087', 'hex'); // for 128-bit block
    const cipher = createCipheriv('aes-128-cbc', key, Buffer.alloc(16, 0));
    cipher.setAutoPadding(false);
    const L = cipher.update(Buffer.alloc(16, 0));

    let K1 = bitShiftLeft(L);
    if (L[0] & 0x80) {
        K1 = xor(K1, const_Rb);
    }

    let K2 = bitShiftLeft(K1);
    if (K1[0] & 0x80) {
        K2 = xor(K2, const_Rb);
    }

    return { K1, K2 };
}

export function aesCmac(key: Buffer, message: Buffer): Buffer {
    const blockSize = 16;
    const { K1, K2 } = generateSubkeys(key);

    const n = Math.ceil(message.length / blockSize) || 1;
    const lastBlockLength = message.length % blockSize;
    const isLastBlockFull = lastBlockLength === 0 && message.length > 0;

    let lastBlock: Buffer;

    if (isLastBlockFull) {
        lastBlock = xor(message.subarray((n - 1) * blockSize), K1);
    } else {
        const paddingObj = Buffer.alloc(blockSize);
        message.copy(paddingObj, 0, (n - 1) * blockSize);
        paddingObj[message.length % blockSize] = 0x80;
        lastBlock = xor(paddingObj, K2);
    }

    let X = Buffer.alloc(blockSize, 0);
    const cipher = createCipheriv('aes-128-cbc', key, Buffer.alloc(16, 0));
    // Note: Standard CMAC uses previous output as IV implies CBC chain, but easiest is manually chaining blocks or using one-shot if supported.
    // Actually, for multiple blocks, we verify:
    // C_0 = 0
    // C_i = AES(K, M_i XOR C_{i-1})
    // Final = AES(K, M_n' XOR C_{n-1})

    // Let's do manual chain
    for (let i = 0; i < n - 1; i++) {
        const M_i = message.subarray(i * blockSize, (i + 1) * blockSize);
        const Y = xor(X, M_i);
        // AES encrypt block
        const blockCipher = createCipheriv('aes-128-ecb', key, null);
        blockCipher.setAutoPadding(false);
        X = blockCipher.update(Y);
    }

    const Y_last = xor(X, lastBlock);
    const finalCipher = createCipheriv('aes-128-ecb', key, null);
    finalCipher.setAutoPadding(false);
    return finalCipher.update(Y_last);
}
