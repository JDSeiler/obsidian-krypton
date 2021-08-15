import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';
import { encryptWithPassword, decryptWithPassword, setUpSystem, PasswordVerificationError } from '../src/services/encryption';

const CORRECT_PASSWORD = 'uhg';
const INCORRECT_PASSWORD = 'wrong';
const PLAIN_TEXT = 'Hello from Jest';
const cryptoSystemFixture = JSON.parse(readFileSync('./test/fixtures/crypto-system.json').toString());

test('Encryption should succeed with a correct password', () => {
  const digest = encryptWithPassword(PLAIN_TEXT, CORRECT_PASSWORD, cryptoSystemFixture);
  expect(digest).toStrictEqual('0e05be752a72ee130eab7ee2eea719');
});

test('Encryption should fail with an incorrect password', () => {
  expect(() => {
    encryptWithPassword(PLAIN_TEXT, INCORRECT_PASSWORD, cryptoSystemFixture);
  }).toThrow(PasswordVerificationError);
});

test('Decrypting a hex digest should return the original contents', () => {
  const digest = encryptWithPassword(PLAIN_TEXT, CORRECT_PASSWORD, cryptoSystemFixture);
  expect(digest).toStrictEqual('0e05be752a72ee130eab7ee2eea719');

  const original = decryptWithPassword(digest, CORRECT_PASSWORD, cryptoSystemFixture);
  expect(original).toStrictEqual(PLAIN_TEXT);
});

test('Decryption should fail with an incorrect password', () => {
  const digest = encryptWithPassword(PLAIN_TEXT, CORRECT_PASSWORD, cryptoSystemFixture);
  expect(digest).toStrictEqual('0e05be752a72ee130eab7ee2eea719');

  expect(() => {
    decryptWithPassword(digest, INCORRECT_PASSWORD, cryptoSystemFixture);
  }).toThrow(PasswordVerificationError);
});

test('Encryption should fail with the wrong crypto system', () => {
  const randomCryptoSystem = setUpSystem('Some totally not right password');
  expect(() => {
    encryptWithPassword(PLAIN_TEXT, CORRECT_PASSWORD, randomCryptoSystem);
  }).toThrow(PasswordVerificationError);
});

test('Decryption should fail with the wrong crypto system', () => {
  const randomCryptoSystem = setUpSystem('Some totally not right password');
  const digest = encryptWithPassword(PLAIN_TEXT, CORRECT_PASSWORD, cryptoSystemFixture);
  expect(() => {
    decryptWithPassword(digest, CORRECT_PASSWORD, randomCryptoSystem);
  }).toThrow(PasswordVerificationError);
});

test('setUpSystem should return a valid cryptosystem for any password', () => {
  for (let i = 0; i < 200; i++) {
    // Generate some goop for a password
    const randomLength = Math.ceil((Math.random() * 100) % 256);
    // https://futurestud.io/tutorials/generate-a-random-string-in-node-js-or-javascript
    const randomPassword = randomBytes(randomLength)
      .toString('utf8');

    const cryptoSystem = setUpSystem(randomPassword);

    // Assert the shape of the object
    expect(cryptoSystem).toMatchObject(expect.objectContaining({
      encryptedPrimaryKey: expect.any(String),
      salt: expect.any(String),
      IV: expect.any(String),
      verifierKey: expect.any(String),
    }));
    
    // Assert the sizes of the components
    expect(cryptoSystem.salt).toHaveLength(16); // 16 hex digits
    expect(cryptoSystem.IV).toHaveLength(32); // 32 hex digits
    expect(cryptoSystem.verifierKey).toHaveLength(32); // also 32 hex digits
    
    // Assert that the produced system + password combination works
    const digest = encryptWithPassword(PLAIN_TEXT, randomPassword, cryptoSystem);
    const original = decryptWithPassword(digest, randomPassword, cryptoSystem);
    expect(original).toStrictEqual(PLAIN_TEXT);
  }
});
