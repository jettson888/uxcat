export const safeJsonParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str)
  } catch (e) {
    console.warn("JSON parse error:", e)
    return defaultValue
  }
}

export const safeJsonStringify = (obj, defaultValue = null) => {
  try {
    return JSON.stringify(obj)
  } catch (e) {
    console.warn("JSON stringify error:", e)
    return defaultValue
  }
}

export const throttle = (fn, delay) => {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}
