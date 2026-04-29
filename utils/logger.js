const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize, errors } = format;

// Custom format for logs
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${stack || message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata, null, 2)}`;
  }
  return msg;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console output with colors
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // Write errors to a separate file
    new transports.File({ filename: "logs/error.log", level: "error" }),
    // Write all logs to combined.log
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

module.exports = logger;
