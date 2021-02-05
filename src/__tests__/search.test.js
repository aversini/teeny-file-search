/* eslint-disable no-magic-numbers */
const { shallowMerge } = require("teeny-js-utilities");
const {
  // public methods / class
  Search,
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
    const search = new Search(
      shallowMerge(
        {
          path: `${process.cwd()}`,
          pattern: "eslint$",
          type: "d",
          boring: true,
          long: false,
          stats: false,
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" ./configuration/eslint");
  });

  it("should find and list a specific file based on the arguments", async () => {
    const search = new Search(
      shallowMerge(
        {
          path: `${process.cwd()}`,
          pattern: "teeny-file-search.js",
          type: "f",
          boring: true,
          long: false,
          stats: true,
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" bin/teeny-file-search.js");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });

  it("should find and list a hidden file based on the arguments", async () => {
    const search = new Search(
      shallowMerge(
        {
          path: `${process.cwd()}`,
          pattern: "ignore",
          type: "f",
          boring: true,
          long: false,
          stats: true,
          dot: true,
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" .gitignore");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });

  it("should find and list files ignore the case based on the arguments", async () => {
    const search = new Search(
      shallowMerge(
        {
          path: `${process.cwd()}`,
          pattern: "a",
          type: "f",
          boring: true,
          long: false,
          stats: true,
          ignoreCase: true,
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" README.md");
    expect(mockLog).toHaveBeenCalledWith(" package.json");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });

  it("should find and list all files when there is no pattern provided", async () => {
    const search = new Search(
      shallowMerge(
        {
          path: `${process.cwd()}`,
          type: "f",
          boring: true,
          long: false,
          stats: true,
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" bin/teeny-file-search.js");
    expect(mockLog).toHaveBeenCalledWith(" package.json");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });
});
