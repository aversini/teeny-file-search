/* eslint-disable no-magic-numbers */
const { shallowMerge } = require("teeny-js-utilities");
const {
  checkPattern,
  convertDate,
  convertSize,
  extractMode,
  formatLongListings,
  getOwnerNameFromId,
  isNotDotNode,
  ignoreFolders,
  printStatistics,
  search,
} = require("../search");

const defaults = require("../defaults");

let mockLog,
  mockLogError,
  mockLogWarning,
  spyExit,
  spyLog,
  spyLogError,
  spyLogWarning,
  mockExit;

describe("when testing for individual utilities with no logging side-effects", () => {
  it("should merge the default and the customer configuration accurately", async () => {
    expect(shallowMerge(defaults, { hello: true })).toStrictEqual({
      hello: true,
      path: process.cwd(),
    });
  });

  it("should extract the correct mode based on the numerical representation", async () => {
    expect(extractMode(33188)).toStrictEqual("rw-r--r--");
  });

  it("should convert bytes to human readable strings spanning on 5 characters", async () => {
    expect(convertSize(1)).toStrictEqual("   1B");
    expect(convertSize(1000)).toStrictEqual("   1K");
    expect(convertSize(1000 * 1000)).toStrictEqual("   1M");
    expect(convertSize(1000 * 1000 * 1000)).toStrictEqual("   1G");
    expect(convertSize(1000 * 1000 * 1000 * 1000)).toStrictEqual("   1T");
  });

  it("should convert a timestamp into a human readable string", async () => {
    const someDate = 1612459361926;
    expect(convertDate(someDate)).toStrictEqual("Feb 4, 09:22");
  });

  it("should get the owner name based on the id", async () => {
    expect(await getOwnerNameFromId(0)).toStrictEqual("root");
  });

  it("should format stats into an expected long listing", async () => {
    expect(
      await formatLongListings(
        {
          mode: 33188,
          size: 1024 * 1000,
          mtime: 1612459361926,
          uid: 0,
        },
        "f"
      )
    ).toStrictEqual({
      mode: "-rw-r--r--",
      size: "   1M",
      mdate: "Feb 4, 09:22",
      owner: "root",
    });
    expect(
      await formatLongListings(
        {
          mode: 33188,
          size: 1024 * 1000,
          mtime: 1612459361926,
          uid: 0,
        },
        "d"
      )
    ).toStrictEqual({
      mode: "drw-r--r--",
      size: "   1M",
      mdate: "Feb 4, 09:22",
      owner: "root",
    });
  });

  it("should return an array with the matched string", async () => {
    const re = /some/;
    const str = "this is some string";
    re.lastIndex = 0;
    expect(checkPattern(re, str)).toStrictEqual(re.exec(str));
  });

  it("should return true if the pattern is not defined ", async () => {
    let re;
    const str = "this is some string";
    expect(checkPattern(re, str)).toBe(true);
  });

  it("should flag blacklisted folders accurately", async () => {
    expect(ignoreFolders(`${process.cwd()}/node_modules`)).not.toBe(null);
    expect(ignoreFolders(`${process.cwd()}/src`)).toBe(null);
  });

  it("should detect if a file or folder is hidden", async () => {
    expect(isNotDotNode("this-file-is-visible.js")).toBe(true);
    expect(isNotDotNode(".but-this-file-is-not-visible.js")).toBe(false);
  });
});

/**
 * Some utilities have logging capabilities that needs to be
 * tested a little bit differently:
 * - mocking process.exit
 * - console.log
 * - inquirer.prompt
 */
describe("when testing for utilities with logging side-effects", () => {
  beforeEach(() => {
    mockExit = jest.fn();
    mockLog = jest.fn();
    mockLogError = jest.fn();
    mockLogWarning = jest.fn();

    spyExit = jest.spyOn(process, "exit").mockImplementation(mockExit);
    spyLog = jest.spyOn(console, "log").mockImplementation(mockLog);
    spyLogError = jest.spyOn(console, "error").mockImplementation(mockLogError);
    spyLogWarning = jest
      .spyOn(console, "warn")
      .mockImplementation(mockLogWarning);
  });
  afterEach(() => {
    spyExit.mockRestore();
    spyLog.mockRestore();
    spyLogError.mockRestore();
    spyLogWarning.mockRestore();
  });

  it("should find and list a specific folder based on the arguments", async () => {
    await search({
      path: `${process.cwd()}`,
      pattern: "eslint$",
      type: "d",
      boring: true,
      long: false,
      stats: false,
    });
    expect(mockLog).toHaveBeenCalledWith(" ./configuration/eslint");
  });

  it("should find and list a specific file based on the arguments", async () => {
    await search({
      path: `${process.cwd()}`,
      pattern: "teeny-file-search.js",
      type: "f",
      boring: true,
      long: false,
      stats: true,
    });
    expect(mockLog).toHaveBeenCalledWith(" bin/teeny-file-search.js");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });

  it("should find and list all files when there is no pattern provided", async () => {
    await search({
      path: `${process.cwd()}`,
      type: "f",
      boring: true,
      long: false,
      stats: true,
    });
    expect(mockLog).toHaveBeenCalledWith(" bin/teeny-file-search.js");
    expect(mockLog).toHaveBeenCalledWith(" package.json");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });

  it("should print statistics for files scans in a nice little box", async () => {
    printStatistics({
      duration: 42,
      totalDirScanned: 222,
      totalDirsFound: 111,
      totalFileScanned: 44,
      totalFilesFound: 33,
      type: "f",
    });

    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining("Total folders scanned: 222")
    );
    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining("Total files scanned: 44")
    );
    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining("Total files matching: 33")
    );
    expect(mockLog).not.toHaveBeenCalledWith(
      expect.stringContaining("Total folders matching: 111")
    );
    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining("Duration: 42ms")
    );
  });

  it("should print statistics for folders scans in a nice little box", async () => {
    printStatistics({
      duration: 42,
      totalDirScanned: 222,
      totalDirsFound: 111,
      totalFileScanned: 44,
      totalFilesFound: 33,
      type: "d",
    });

    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining("Total folders scanned: 222")
    );
    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining("Total files scanned: 44")
    );
    expect(mockLog).not.toHaveBeenCalledWith(
      expect.stringContaining("Total files matching: 33")
    );
    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining("Total folders matching: 111")
    );
    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining("Duration: 42ms")
    );
  });
});
