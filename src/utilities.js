const boxen = require("boxen");
const { green, yellow } = require("kleur");
const { runCommand } = require("teeny-js-utilities");
const TeenyLogger = require("teeny-logger");
const logger = new TeenyLogger({
  boring: process.env.NODE_ENV === "test",
});

const BYTE_CHUNKS = 1000;
const DECIMAL = 10;
const LAST_THREE_ENTRIES = -3;
const MODE_GROUP_POS = 1;
const MODE_OWNER_POS = 0;
const MODE_WORD_POS = 2;
const OCTAL = 8;
const STR_TYPE_DIRECTORY = "d";
const STR_TYPE_FILE = "f";

const ownerNames = {
  0: "root",
};

function extractMode(mode) {
  const modeDec = parseInt(mode.toString(OCTAL), DECIMAL)
    .toString()
    .slice(LAST_THREE_ENTRIES);
  const modeOwner = modeDec.charAt(MODE_OWNER_POS);
  const modeGroup = modeDec.charAt(MODE_GROUP_POS);
  const modeWorld = modeDec.charAt(MODE_WORD_POS);
  const modes = {
    0: "---",
    1: "--x",
    2: "-w-",
    3: "-wx",
    4: "r--",
    5: "r-x",
    6: "rw-",
    7: "rwx",
  };
  return modes[modeOwner] + modes[modeGroup] + modes[modeWorld];
}

function convertSize(bytes) {
  const sizes = ["B", "K", "M", "G", "T"];
  const len = 5;
  let posttxt = 0;

  while (bytes >= BYTE_CHUNKS) {
    posttxt = posttxt + 1;
    bytes = bytes / BYTE_CHUNKS;
  }
  const str = parseInt(bytes, DECIMAL).toFixed(0) + sizes[posttxt];
  return new Array(len + 1 - str.length).join(" ") + str;
}

function convertDate(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...timeZone,
  }).format(date);
}

const getOwnerNameFromId = async (uid) => {
  let res;

  /* istanbul ignore if */
  if (!ownerNames[uid]) {
    try {
      res = await runCommand(`id -nu ${uid}`);
      ownerNames[uid] = res;
      return res;
    } catch (e) {
      // nothing to declare officer
      return uid;
    }
  } else {
    return ownerNames[uid];
  }
};

const formatLongListings = async (stat, type) => {
  const delim = type === STR_TYPE_FILE ? "-" : "d";
  return {
    mode: delim + extractMode(stat.mode),
    size: `${convertSize(stat.size)}`,
    mdate: `${convertDate(stat.mtime)}`,
    owner: `${await getOwnerNameFromId(stat.uid)}`,
  };
};

const printStatistics = ({
  duration,
  totalDirScanned,
  totalDirsFound,
  totalFileScanned,
  totalFilesFound,
  type,
}) => {
  let msg = `Total folders scanned: ${yellow(totalDirScanned)}\n`;
  msg += `Total files scanned: ${yellow(totalFileScanned)}\n`;
  msg +=
    type === STR_TYPE_DIRECTORY
      ? `Total folders matching: ${green(totalDirsFound)}\n`
      : `Total files matching: ${green(totalFilesFound)}\n`;
  msg += `Duration: ${yellow(`${duration}ms`)}`;
  logger.log();
  logger.log(
    boxen(msg, {
      padding: 1,
      align: "center",
      borderColor: "yellow",
    })
  );
};

function checkPattern(rePattern, str) {
  if (rePattern) {
    rePattern.lastIndex = 0;
    return rePattern.exec(str);
  }
  return true;
}

module.exports = {
  convertDate,
  convertSize,
  checkPattern,
  extractMode,
  formatLongListings,
  getOwnerNameFromId,
  printStatistics,
  STR_TYPE_DIRECTORY,
  STR_TYPE_FILE,
};
