/**
 * Simple structured console logger for test execution
 */
class Logger {
  static info(message, ...args) {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  }

  static pass(message, ...args) {
    console.log(`[PASS] [${new Date().toISOString()}] \x1b[32m${message}\x1b[0m`, ...args);
  }

  static warn(message, ...args) {
    console.warn(`[WARN] [${new Date().toISOString()}] \x1b[33m${message}\x1b[0m`, ...args);
  }

  static error(message, ...args) {
    console.error(`[ERROR] [${new Date().toISOString()}] \x1b[31m${message}\x1b[0m`, ...args);
  }
}

module.exports = Logger;
