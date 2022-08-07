package utils

func Filter[U any](xs []U, pred func(U) bool) []U {
	var rv []U
	for _, x := range xs {
		if pred(x) {
			rv = append(rv, x)
		}
	}

	return rv
}
