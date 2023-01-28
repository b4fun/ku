# Getting Started

## Installation

Currently only manual installation is supported. Download a release based on your platform from [release page][release_page]. Uncompress the archive and put the `ku` binary in your `$PATH`.

[release_page]: https://github.com/b4fun/ku/releases

## Usage

### First Run

The simplest way to run Ku is to put it in the beginning of your command:

```
$ ku --ku-db-path=./db.sqlite sh -c 'echo hello, world'
hello, world
```

| | |
|:------|:-------|
| When you can see this output, open your browser and navigate to `http://localhost:4000`. You should see the Ku web interface similar to this: | <img src="assets/getting-started 1.png" /> |
| Select the `raw` *table* under the `sh_xxxx` item, and press the `Run` button on the top: | <img src="assets/getting-started 2.png" /> |

### Second Run

By default, Ku blocks until we stop the process. To stop previous run, press `Ctrl-C` in the terminal.

To revisit the logs without running the sub-command again, we can run Ku in readonly mode:

```
$ ku --ku-db-path=./db.sqlite --ku-readonly
2023-01-28T14:21:16.451+0800	INFO	http-server	svc/grpcweb.go:73	server started	{"http.addr": "127.0.0.1:4000"}
```

Under this mode, ku reads the previous saved logs and starts the web server. Now we can open the browser and navigate to `http://localhost:4000` again. We should see the same result as the previous run.