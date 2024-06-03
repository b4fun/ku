module github.com/b4fun/ku/server

go 1.18

require (
	github.com/alecthomas/kong v0.8.0
	github.com/b4fun/ku/protos v0.0.0-00010101000000-000000000000
	github.com/go-logr/logr v1.4.2
	github.com/go-logr/zapr v1.2.4
	github.com/improbable-eng/grpc-web v0.15.0
	github.com/jmoiron/sqlx v1.3.5
	github.com/lithammer/shortuuid v3.0.0+incompatible
	github.com/mattn/go-sqlite3 v1.14.17
	github.com/rs/cors v1.10.0
	github.com/stretchr/testify v1.8.4
	go.uber.org/zap v1.26.0
	google.golang.org/grpc v1.64.0
	google.golang.org/protobuf v1.33.0
)

require (
	github.com/cenkalti/backoff/v4 v4.1.3 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/desertbit/timer v0.0.0-20180107155436-c41aec40b27f // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/klauspost/compress v1.15.10 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	go.uber.org/multierr v1.10.0 // indirect
	golang.org/x/net v0.23.0 // indirect
	golang.org/x/sys v0.18.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20240318140521-94a12d6c2237 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	nhooyr.io/websocket v1.8.7 // indirect
)

replace github.com/b4fun/ku/protos => ../protos
