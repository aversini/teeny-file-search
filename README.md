# Teeny File Search

![npm](https://img.shields.io/npm/v/teeny-file-search?label=version&logo=npm)
![David](https://img.shields.io/david/aversini/teeny-file-search?logo=npm)
![David](https://img.shields.io/david/dev/aversini/teeny-file-search?logo=npm)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/aversini/teeny-file-search/coverage?label=coverage&logo=github)

> Teeny File Search is a command line tool that can:
>
> - find files or folders that match a certain pattern
> - look for string within those files and display them (think find and grep)

## Installation

```sh
> cd your-project
> npm install --global teeny-file-search
```

## Requirements

Node.js version 12 or higher is required.

## Examples

**Get help**

```sh
> teeny-file-search --help
Usage: teeny-file-search [options] [path]

Options:
  -b, --boring            Do not use color output (default: false)
  -c, --command <cmd>     Command to execute over each node (ex: chmod +x)
  --dot                   Show hidden files and directories (default: false)
  -g, --grep <pattern>    A regular expression to match the content of the files found
  -h, --help              Display help instructions
  -i, --ignore-case       Ignore case when searching (default: false)
  -p, --pattern <string>  A regular expression to match file or folder names (default: null)
  -s, --stats             Display some statistics (default: false)
  --short                 Short listing format (equivalent to ls) (default: false)
  -t, --type <string>     Search for files (f) or directories (d)
  -v, --version           Output the current version

Path: the path where to search for files or directories (default: current folder)
```

**Find all the files that ends with the extension ".jsx" in the `src` folder**

```sh
> teeny-file-search --type f --pattern ".jsx$" src
```

**Find all the folders which name or path includes \_\_tests\_\_ in the `src` folder**

```sh
> teeny-file-search --type d --pattern "__tests__" src
```

**Change the permissions to executable for all the files found under the `bin` folder**

```sh
> teeny-file-search --type f --command "chmod +x"
```

**Search in all the markdown files under the `src` folder for the keywords "Table of Content"**

```sh
> teeny-file-search -type f --pattern ".md$" --grep "Table of Content"
```

## License

MIT © Arno Versini
