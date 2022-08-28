package dbext

import (
	"encoding/json"
	"fmt"
	"regexp"

	"github.com/mattn/go-sqlite3"
)

const FunctionNameParse = "ku_parse"

type kqlParse struct {
	// TODO: implement cache for regex loaded result
}

// Parse implements the ku_parse function.
//
//   select json_extract(ku_parse(lines, '.*'), '$.foo') as foo from source
func (p *kqlParse) Parse(fieldValue string, regexpPattern string) (string, error) {
	re, err := regexp.Compile(regexpPattern)
	if err != nil {
		return "", fmt.Errorf("compile %q: %w", regexpPattern, err)
	}

	matched := re.FindStringSubmatch(fieldValue)
	parsedValue := map[string]interface{}{}
	for i, name := range re.SubexpNames() {
		if i < len(matched) {
			parsedValue[name] = matched[i]
		} else {
			parsedValue[name] = nil
		}
	}

	jsonEncoded, err := json.Marshal(parsedValue)
	if err != nil {
		return "", fmt.Errorf("encode value: %w", err)
	}
	return string(jsonEncoded), nil
}

// RegisterParseModule registers the ku_parse function.
func RegisterParseModule(conn *sqlite3.SQLiteConn) error {
	parser := &kqlParse{}

	return conn.RegisterFunc(
		FunctionNameParse,
		parser.Parse,
		true,
	)
}
