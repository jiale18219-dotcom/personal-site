import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const KEY_LENGTH = 64;
const SALT_LENGTH_BYTES = 16;
const SALT_HEX_LENGTH = SALT_LENGTH_BYTES * 2;
const KEY_HEX_LENGTH = KEY_LENGTH * 2;
const HASH_PREFIX = "scrypt";
const HEX_PATTERN = /^[0-9a-f]+$/;
const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH_BYTES).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return `${HASH_PREFIX}:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split(":");

  if (parts.length !== 3) {
    return false;
  }

  const [algorithm, salt, key] = parts;

  if (
    algorithm !== HASH_PREFIX ||
    salt.length !== SALT_HEX_LENGTH ||
    key.length !== KEY_HEX_LENGTH ||
    !HEX_PATTERN.test(salt) ||
    !HEX_PATTERN.test(key)
  ) {
    return false;
  }

  const expected = Buffer.from(key, "hex");

  if (expected.length !== KEY_LENGTH) {
    return false;
  }

  const actual = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
