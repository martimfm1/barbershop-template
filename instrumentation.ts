export async function register() {
  if (process.env.NODE_ENV !== "production") return;

  const noop = () => undefined;
  console.log = noop;
  console.info = noop;
  console.debug = noop;
}
