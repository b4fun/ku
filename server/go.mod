module github.com/b4fun/ku/server

go 1.18

require (
	github.com/alecthomas/kong v0.7.1
	github.com/b4fun/ku/protos v0.0.0-00010101000000-000000000000
	github.com/go-logr/logr v1.2.4
	github.com/go-logr/zapr v1.2.3
	github.com/improbable-eng/grpc-web v0.15.0
	github.com/jmoiron/sqlx v1.3.5
	github.com/lithammer/shortuuid v3.0.0+incompatible
	github.com/mattn/go-sqlite3 v1.14.16
	github.com/rs/cors v1.9.0
	github.com/stretchr/testify v1.8.2
	go.uber.org/zap v1.24.0
	google.golang.org/grpc v1.55.0
	google.golang.org/protobuf v1.30.0
)

require (
	github.com/cenkalti/backoff/v4 v4.1.3 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/desertbit/timer v0.0.0-20180107155436-c41aec40b27f // indirect
	github.com/golang/protobuf v1.5.3 // indirect
	github.com/google/uuid v1.3.0 // indirect
	github.com/klauspost/compress v1.15.10 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	go.uber.org/atomic v1.7.0 // indirect
	go.uber.org/multierr v1.6.0 // indirect
	golang.org/x/net v0.8.0 // indirect
	golang.org/x/sys v0.6.0 // indirect
	golang.org/x/text v0.8.0 // indirect
	google.golang.org/genproto v0.0.0-20230306155012-7f2fa6fef1f4 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	nhooyr.io/websocket v1.8.7 // indirect
)

replace github.com/b4fun/ku/protos => ../protos
