package apperr

import (
	"errors"
	"fmt"
)

// Code is a stable, machine-readable application error code.
// It is returned to clients via controller error responses.
type Code string

const (
	CodeBadRequest   Code = "bad_request"
	CodeUnauthorized Code = "unauthorized"
	CodeForbidden    Code = "forbidden"
	CodeNotFound     Code = "not_found"
	CodeConflict     Code = "conflict"

	// External dependency / upstream errors.
	CodeUpstreamUnavailable Code = "upstream_unavailable"
	CodeQuotaExceeded       Code = "quota_exceeded"

	// Default catch-all.
	CodeInternal Code = "internal_error"
)

// Error is a typed application error used across service boundaries.
// PublicMessage is safe to show to clients. Cause is the internal error.
type Error struct {
	Code          Code
	PublicMessage string
	Cause         error
}

func (e *Error) Error() string {
	if e == nil {
		return "<nil>"
	}
	if e.Cause == nil {
		return fmt.Sprintf("%s: %s", e.Code, e.PublicMessage)
	}
	return fmt.Sprintf("%s: %s: %v", e.Code, e.PublicMessage, e.Cause)
}

func (e *Error) Unwrap() error { return e.Cause }

func New(code Code, publicMessage string) *Error {
	return &Error{Code: code, PublicMessage: publicMessage}
}

func Wrap(cause error, code Code, publicMessage string) *Error {
	if cause == nil {
		return New(code, publicMessage)
	}
	return &Error{Code: code, PublicMessage: publicMessage, Cause: cause}
}

func As(err error) (*Error, bool) {
	var e *Error
	if errors.As(err, &e) && e != nil {
		return e, true
	}
	return nil, false
}
