package applog

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_Setup(t *testing.T) {
	require.NotNil(t, Setup)
}
