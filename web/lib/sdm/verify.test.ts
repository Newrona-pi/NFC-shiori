import { describe, it, expect, beforeAll } from 'vitest'
import { aesCmac, hexToBuffer, bufferToHex } from './cmac'
import { verifySdm } from './verify'
import { createCipheriv } from 'node:crypto'

describe('AES-CMAC (RFC 4493)', () => {
    const key = hexToBuffer('2b7e151628aed2a6abf7158809cf4f3c')

    it('Example 1: Empty message', () => {
        const msg = Buffer.alloc(0)
        const expected = 'bb1d6929e95937287fa37d129b756746'.toUpperCase()
        const result = bufferToHex(aesCmac(key, msg))
        expect(result).toBe(expected)
    })

    it('Example 2: 16 bytes message', () => {
        const msg = hexToBuffer('6bc1bee22e409f96e93d7e117393172a')
        const expected = '070a16b46b4d4144f79bdd9dd04a287c'.toUpperCase()
        const result = bufferToHex(aesCmac(key, msg))
        expect(result).toBe(expected)
    })

    it('Example 3: 40 bytes message', () => {
        const msg = hexToBuffer('6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411')
        const expected = 'dfa66747de9ae63030ca32611497c827'.toUpperCase()
        const result = bufferToHex(aesCmac(key, msg))
        expect(result).toBe(expected)
    })
})

describe('SDM Verify Logic', () => {
    // Set up env for test logic (mocking process.env isn't easy directly if module already loaded, but verifySdm reads env at top level?
    // Actually, verifySdm reads process.env at module usage.
    // We might need to rely on the fallback buffer alloc if env missing, or set env before import?
    // Vitest runs in same process.

    // Actually, my `verifySdm` implementation reads env at TOP LEVEL.
    // const META_READ_KEY = ...
    // So changing process.env inside test might be too late if verified imported.
    // However, for this test I will assume default (zero key) or if I can't trigger standard logic, I'll check basic behavior.

    // Let's use the Zero Key (default fallback) for testing if env not set.
    const KEY = Buffer.alloc(16, 0)
    const FILE_KEY = Buffer.alloc(16, 0)

    it('should verify a valid generated payload', () => {
        // 1. Construct valid UID + CTR
        const uidHex = "04112233445566"
        const ctrVal = 123456

        const payload = Buffer.alloc(16) // 16 bytes e?
        // My implementation assumes simple e -> decrypt -> uid+ctr logic
        // e is AES-CBC encrypted [UID(7)][CTR(3)][Pad(6)]

        const cleartext = Buffer.alloc(16) // Decrypted content
        const uidBuf = hexToBuffer(uidHex)
        uidBuf.copy(cleartext, 0)

        // CTR Little Endian 3 bytes
        cleartext.writeUIntLE(ctrVal, 7, 3)

        // Encrypt 'e' using FILE_KEY
        const cipher = createCipheriv('aes-128-cbc', FILE_KEY, Buffer.alloc(16, 0))
        cipher.setAutoPadding(false)
        const e = Buffer.concat([cipher.update(cleartext), cipher.final()])
        const eHex = bufferToHex(e)

        // Generate 'c' (CMAC) using META_READ_KEY
        // CMAC Input: [UID][CTR] padded to ? My implementation takes first 10 bytes and pads to 16? 
        // check code:
        // const cmacInput = Buffer.alloc(16)
        // decrypted.copy(cmacInput, 0, 0, 7)
        // decrypted.copy(cmacInput, 7, 7, 10)

        const cmacInput = Buffer.alloc(16)
        uidBuf.copy(cmacInput, 0)
        cmacInput.writeUIntLE(ctrVal, 7, 3)

        const fullCmac = aesCmac(KEY, cmacInput)
        const c = fullCmac.subarray(0, 8)
        const cHex = bufferToHex(c)

        // 2. Test
        const result = verifySdm(eHex, cHex, "any-tid")

        expect(result.isValid).toBe(true)
        expect(result.uid).toBe(uidHex)
        expect(result.ctr).toBe(ctrVal)
    })

    it('should fail if CMAC is wrong', () => {
        const uidHex = "04112233445566"
        const ctrVal = 123456

        // Encrypt...
        const cleartext = Buffer.alloc(16)
        hexToBuffer(uidHex).copy(cleartext, 0)
        cleartext.writeUIntLE(ctrVal, 7, 3)

        const cipher = createCipheriv('aes-128-cbc', FILE_KEY, Buffer.alloc(16, 0))
        cipher.setAutoPadding(false)
        const eHex = bufferToHex(Buffer.concat([cipher.update(cleartext), cipher.final()]))

        // Wrong C
        const cHex = "0000000000000000"

        const result = verifySdm(eHex, cHex, "any-tid")
        expect(result.isValid).toBe(false)
    })
})
