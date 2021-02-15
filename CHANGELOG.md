## [1.1.2](https://github.com/aversini/teeny-file-search/compare/v1.1.1...v1.1.2) (2021-02-15)


### Bug Fixes

* errors are not obvious enough ([ca5ef1e](https://github.com/aversini/teeny-file-search/commit/ca5ef1e1457fa421cc9a9c0216f9d3829f03e9ae))
* minor UI refinement - removing extra line if in grep mode ([298bfd3](https://github.com/aversini/teeny-file-search/commit/298bfd3aa339cb4a25429dbe4d11616de5e6fc88))



## [1.1.1](https://github.com/aversini/teeny-file-search/compare/v1.1.0...v1.1.1) (2021-02-14)


### Bug Fixes

* invalid stats (total files found) when grep is used ([368054b](https://github.com/aversini/teeny-file-search/commit/368054b6254f748f8709795a4d92bfe18faa9448))
* removing debug log prefix ([9201124](https://github.com/aversini/teeny-file-search/commit/92011241c4e3428b46b6997648c85c7f7bc1f3fe))



# [1.1.0](https://github.com/aversini/teeny-file-search/compare/v1.0.1...v1.1.0) (2021-02-10)


### Features

* adding support for --ignore-case for the --grep option ([8a4ee03](https://github.com/aversini/teeny-file-search/commit/8a4ee03b1391db9e2f65dbb2a0cdde5d0d00077e))
* migrating from commander to meow for a better CLI experience ([5580e81](https://github.com/aversini/teeny-file-search/commit/5580e81ef8fa486e29200a2d41f5658805585f2e))


### Performance Improvements

* reduced date/time calculations times (sample 1.5s to <500ms) ([8d3b0ef](https://github.com/aversini/teeny-file-search/commit/8d3b0eff5039c2ab5860dca01f9cbfc97f9749fe))



## [1.0.1](https://github.com/aversini/teeny-file-search/compare/v1.0.0...v1.0.1) (2021-02-06)


### Bug Fixes

* better duration formatting (ms vs seconds) ([d74a056](https://github.com/aversini/teeny-file-search/commit/d74a056fb9be03e1f72814104c87a7951959960f))
* results should not display total files/folders found if there was no pattern ([d8b8502](https://github.com/aversini/teeny-file-search/commit/d8b85023a2b3ed49fb477194338820d21b54e706))


### Performance Improvements

* do not rely on synchronous methods anymore ([4370c4f](https://github.com/aversini/teeny-file-search/commit/4370c4f476a75995d4411214201271e3292d3047))



# 1.0.0 (2021-02-06)


### Bug Fixes

* better date print ([f80e41a](https://github.com/aversini/teeny-file-search/commit/f80e41ac4a64e3ef2569cf73b31ea08f0b31bfab))
* date and time are not aligned when day is 2 digits ([f062f38](https://github.com/aversini/teeny-file-search/commit/f062f38ca8612465bdaabf9595ddede2604387cc))
* higlight is messing the end of the lines ([e2d8798](https://github.com/aversini/teeny-file-search/commit/e2d87989a47b968778ba13cdf26e7c266b47816a))
* multimatch display is breaking when there is no pattern ([ac77782](https://github.com/aversini/teeny-file-search/commit/ac77782b6dcce4aeaf05978c666f07e5e0b15126))


### Features

* adding support for --command ([c64eee1](https://github.com/aversini/teeny-file-search/commit/c64eee1467551bad5af9266f3bf9ea120470b7d9))
* adding support for grep in files ([9717f5d](https://github.com/aversini/teeny-file-search/commit/9717f5d1faed794bf1f08495f894af23d78cbe55))
* allowing search type (file or folder) to be omitted ([f787512](https://github.com/aversini/teeny-file-search/commit/f78751263612c90eaae9d83b230eff84c6a09323))



