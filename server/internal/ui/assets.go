package ui

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:generate sh -c "rm -rf ./dist/* && cp -r ../../../prql-browser/dist ."

//go:embed dist/*
var assets embed.FS

// MustNewHTTP creates a new HTTP handler for the UI.
// It panics on error.
func MustNewHTTP() http.Handler {
	distFS, err := fs.Sub(assets, "dist")
	if err != nil {
		panic(err)
	}

	return http.FileServer(http.FS(distFS))
}
