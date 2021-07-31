import * as aesjs from 'aes-js';
import { randomBytes, pbkdf2Sync } from 'crypto';

/*
The cryptographic system in use here is taken from the following
Security StackExchange post: https://security.stackexchange.com/a/38854
*/

// A CryptoSystem where every property is represented as a hex string.
// Used for safely storing the CryptoSystem as a JSON file.
interface StorableCryptoSystem {
  encryptedPrimaryKey: string;
  IV: string;
  salt: string;
  verifierKey: string;
}

interface CryptoSystem {
  encryptedPrimaryKey: Uint8Array;
  IV: Uint8Array;
  salt: Uint8Array;
  verifierKey: Uint8Array;
}

/**
* Alias for `aesjs.utils.hex.fromBytes(bytes)`
* */
const hexString = (bytes: Uint8Array) => {
  return aesjs.utils.hex.fromBytes(bytes);
};

/**
* Alias for `aesjs.utils.hex.toBytes(hexString)`
* */
const bytes = (hexString: string) => {
  // Was getting an Array back instead of Uint8Array?
  // Wrapping in constructor fixed the problem
  return new Uint8Array(aesjs.utils.hex.toBytes(hexString));
};

/**
* @param a some Uint8Array
* @param b some Uint8Array
* @returns true if and only if UInt8Array are structurally equal
*/
const equal = (a: Uint8Array, b: Uint8Array): boolean => {
  return a.length === b.length && a.every((v, idx, _) => v === b[idx]);
};

/**
* Prepares all of the binary data necessary for securely encrypting/decrypting
* files. 
* @param password the user provided password
* @returns A StorableCryptoSystem read to be written to a file
*/
export const setUpSystem = (password: string): StorableCryptoSystem => {
  const rawPrimaryKey = randomBytes(16); // Used to encrypt files
  const IV = randomBytes(16); 
  const salt = randomBytes(8); 
  
  // Make one big key and then split it in two. The first half is used
  // to encrypt the primaryKey, and is never stored ever. The second half
  // is used to check the validity of the password.
  const twoKeys = pbkdf2Sync(password, salt, 1500, 32, 'sha256');
  const secretKey = twoKeys.slice(0, 16); 
  const verifierKey = twoKeys.slice(16);
  
  const aesCbc = new aesjs.ModeOfOperation.cbc(secretKey, IV);
  const encryptedPrimaryKey = aesCbc.encrypt(rawPrimaryKey);
  
  return {
    encryptedPrimaryKey: hexString(encryptedPrimaryKey),
    IV: IV.toString('hex'),
    salt: salt.toString('hex'),
    verifierKey: verifierKey.toString('hex')
  };
};

/**
* @param rawSystem the CryptoSystem as loaded from disk
* @returns A CryptoSystem where each property is converted to a Uint8Array
*/
const convertSystem = (rawSystem: StorableCryptoSystem): CryptoSystem => {
  return {
    encryptedPrimaryKey: bytes(rawSystem.encryptedPrimaryKey),
    IV: bytes(rawSystem.IV),
    salt: bytes(rawSystem.salt),
    verifierKey: bytes(rawSystem.verifierKey)
  };
};

const applySystem = (inputText: string, password: string, storedCryptoSystem: StorableCryptoSystem, mode: 'ENCRYPT' | 'DECRYPT') => {
  const cryptoSystem = convertSystem(storedCryptoSystem);
  
  const twoKeys = pbkdf2Sync(password, cryptoSystem.salt, 1500, 32, 'sha256');
  const secretKey = twoKeys.slice(0, 16);
  const testKey = twoKeys.slice(16);
  
  if (!equal(Uint8Array.from(testKey), cryptoSystem.verifierKey)) {
    // This can happen because of a bad password, or tampering
    // Do not touch the files if this happens.
    throw new PasswordVerificationError('Generated key and verifier key did not match! BAD BAD BAD');
  }
  
  if (mode === 'ENCRYPT') {
    const aesCbc = new aesjs.ModeOfOperation.cbc(secretKey, cryptoSystem.IV);
    const primaryKey = aesCbc.decrypt(cryptoSystem.encryptedPrimaryKey);
    
    const plainBytes = aesjs.utils.utf8.toBytes(inputText);
    const aesCtr = new aesjs.ModeOfOperation.ctr(primaryKey);
    
    return hexString(aesCtr.encrypt(plainBytes));
  } else if (mode === 'DECRYPT') {
    const aesCbc = new aesjs.ModeOfOperation.cbc(secretKey, cryptoSystem.IV);
    const primaryKey = aesCbc.decrypt(cryptoSystem.encryptedPrimaryKey);
    
    // subtle detail: The input text is a hex string isntead of utf-8
    const plainBytes = aesjs.utils.hex.toBytes(inputText);
    const aesCtr = new aesjs.ModeOfOperation.ctr(primaryKey);
    
    // Return the utf8 directly since it's safe to write to a file.
    return aesjs.utils.utf8.fromBytes(aesCtr.decrypt(plainBytes));
  } else {
    throw new Error(`Unrecognized mode: ${mode}`);
  }
};

export const encryptWithPassword = (plain: string, password: string, storedCryptoSystem: StorableCryptoSystem) => {
  return applySystem(plain, password, storedCryptoSystem, 'ENCRYPT');
};

export const decryptWithPassword = (cipher: string, password: string, storedCryptoSystem: StorableCryptoSystem) => {
  return applySystem(cipher, password, storedCryptoSystem, 'DECRYPT');
};

export class PasswordVerificationError extends Error {
  constructor(message: string) {
    super(message);
  }
}
