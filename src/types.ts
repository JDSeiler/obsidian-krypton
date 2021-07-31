export type Option<T> = T | null;
// export type Result<T, E extends Error> = T | E;

export function unwrap<T>(o: Option<T>): T {
  if (o !== null) {
    return o;
  } else {
    throw new Error('Unwrap on null value');
  }
}

export function isSome<T>(o: Option<T>): boolean {
  return o !== null;
}

export function isNone<T>(o: Option<T>): boolean {
  return o === null;
}
