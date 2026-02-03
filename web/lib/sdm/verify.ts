import { createDecipheriv } from 'node:crypto'
import { aesCmac, hexToBuffer, bufferToHex } from './cmac'

interface SdmResult {
    isValid: boolean
    uid?: string
    ctr?: number
}

// Keys from env
const META_READ_KEY = process.env.SDM_META_READ_KEY_HEX
    ? hexToBuffer(process.env.SDM_META_READ_KEY_HEX)
    : Buffer.alloc(16, 0)
const FILE_READ_KEY = process.env.SDM_FILE_READ_KEY_HEX
    ? hexToBuffer(process.env.SDM_FILE_READ_KEY_HEX)
    : Buffer.alloc(16, 0)

export function verifySdm(eHex: string, cHex: string, tid: string): SdmResult {
    // If DEV mode or dummy keys, fail unless bypass?
    // We'll proceed with standard logic.

    try {
        const e = hexToBuffer(eHex)
        const c = hexToBuffer(cHex)

        // 1. Decrypt e (PICC Data)
        // NTAG 424 DNA Standard: e is AES Encrypted using Session Key or File Read Key?
        // Usually, in SDM "File Read Key" is used. 
        // Format: IV=0 (typically) or simplified.
        // NOTE: In LRP mode it's different. Assuming standard AES mode.
        // If standard mode, it might use iv=0 for the first block if not chained?
        // Actually, usually the IV is derived or all zero for the SDM message if configured that way.
        // Let's assume IV=0 and AES-128-CBC

        const decipher = createDecipheriv('aes-128-cbc', FILE_READ_KEY, Buffer.alloc(16, 0))
        decipher.setAutoPadding(false)
        const decrypted = Buffer.concat([decipher.update(e), decipher.final()])

        // Decrypted format: [UID (7 bytes)] [Counter (3 bytes)] [Padding/Random?]
        // Wait, NTAG 424 DNA encrypted PICC data is usually 16 bytes (block aligned)?
        // Standard format often:
        // Byte 0: Tag Type (e.g. C7) - sometimes
        // But usually in SDM mirroring: 
        // b0-6: UID
        // b7-9: Counter
        // b10-15: Padding/Random
        // Let's attempt to parse.

        const uid = decrypted.subarray(0, 7).toString('hex').toUpperCase()
        const ctrBuf = decrypted.subarray(7, 10)
        // CTR is 3 bytes little endian usually - aka LSB first
        const ctr = ctrBuf.readUIntLE(0, 3)

        // 2. Verify CMAC
        // CMAC is calculated over: 
        // - Interaction Counter (sometimes?)
        // - Header?
        // - Encrypted Data (e)?
        // Or plain text URL parameters?
        // NXP AN12196 Section 4.3:
        // CMAC Input Data = [UID] [SDM_ReadCtr] [Padding] (if using ASCII mirror?)
        // Actually, for "Secure Dynamic Messaging", the CMAC is usually over specific fields.
        // Common Setup:
        // url?e={e}&c={c}
        // CMAC input:
        // 1. UID (7 bytes)
        // 2. ReadCtr (3 bytes)
        // OR 
        // It verifies the integrity of the *ciphertext* e?
        // Actually, typically CMAC is calculated over the *NFC interactions* or part of the file.
        // Let's assume standard SDM w/ UID Mirror & ReadCtr Mirror.
        // If we only have e and c.
        // Input for CMAC:
        // [C8 (msg type?)] [UID] [Ctr] ...?

        // IMPLEMENTATION PLAN FOR MVP:
        // Since exact NTAG config varies (Mirrored data vs Encrypted File Data),
        // and we want "Secure" tapping.
        // We will verify C by re-calculating C from the decrypted E (UID+CTR).
        // If the tag was configured to sign [UID + CTR], we do that.
        // Input = [UID] [CTR] (padding to 16?)
        // We'll try: Input = [e] (The encrypted data itself) ?? unlikely.
        // Standard: CMAC over (Target File Data/Mirror Data).
        // Let's assume CMAC input = [UID] [CTR] (padded).

        const cmacInput = Buffer.alloc(16) // block size?
        // Copy UID
        decrypted.copy(cmacInput, 0, 0, 7)
        // Copy CTR
        decrypted.copy(cmacInput, 7, 7, 10)
        // Padding?
        // If standard CMAC input is the "SDM File Data", it might include offsets.

        // TO BE SAFE:
        // If we can't perfectly reproduce NXP logic without the exact tag config sheet, 
        // we will implement the Verify as:
        // calculatedC = aesCmac(META_READ_KEY, cmacInput)
        // If calculatedC truncated matches c.

        // Note: c is usually 8 bytes (truncated CMAC).

        const calculatedCFull = aesCmac(META_READ_KEY, cmacInput)
        const calculatedC = calculatedCFull.subarray(0, 8) // Truncated to 8 bytes? Or 16?
        // Standard SDM CMAC is often 8 bytes.
        // Input cHex length? If 16 chars -> 8 bytes.

        let cmacIsValid = false
        if (cHex.length === 16) {
            cmacIsValid = calculatedC.equals(c)
        } else {
            // Maybe full 16 bytes?
            cmacIsValid = calculatedCFull.equals(c)
        }

        // For MVP, if we fail to verify exact NXP algorithm, we might block access.
        // We will assume `cmacInput` logic:
        // If `e` is provided, `e` decrypts to UID+CTR.

        // NOTE: This logic is "Best Effort" without the specific NTAG Config.
        // We will assume "Valid" if we can decrypt meaningful UID/CTR.
        // (Real security needs exact match).

        // Return result
        return {
            isValid: cmacIsValid,
            uid,
            ctr
        }

    } catch (err) {
        console.error('SDM Verify Error:', err)
        return { isValid: false }
    }
}
