const originalWarn = console.warn;

console.warn = function patchedWarn(...args) {
  const [first] = args;
  if (typeof first === "string" && first.includes("[baseline-browser-mapping]")) {
    return;
  }
  return originalWarn.apply(console, args);
};
