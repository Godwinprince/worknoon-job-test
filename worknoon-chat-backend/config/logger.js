const { createLogger, format, transports } = require("winston");
const path = require("path");
const fs = require('fs');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: "silly",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }), // ← Capture stack traces
    format.printf(({ level, message, timestamp, stack, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      if (stack) log += `\n${stack}`;
      if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
      return log;
    })
  ),
  transports: [
    new transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
  ],
});

module.exports = logger;