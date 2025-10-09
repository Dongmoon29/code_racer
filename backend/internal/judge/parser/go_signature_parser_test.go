package parser

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGoSignatureParser_ParseFunctionSignature(t *testing.T) {
	parser := NewGoSignatureParser()

	tests := []struct {
		name         string
		code         string
		functionName string
		expected     *FunctionSignature
	}{
		{
			name: "simple_function_with_array_params",
			code: `package main

func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {
    return 0.0
}`,
			functionName: "findMedianSortedArrays",
			expected: &FunctionSignature{
				Name:       "findMedianSortedArrays",
				ParamTypes: []string{"[]int", "[]int"},
				ReturnType: "float64",
			},
		},
		{
			name: "function_with_mixed_types",
			code: `package main

func processData(arr []int, count int, name string) bool {
    return true
}`,
			functionName: "processData",
			expected: &FunctionSignature{
				Name:       "processData",
				ParamTypes: []string{"[]int", "int", "string"},
				ReturnType: "bool",
			},
		},
		{
			name: "function_with_pointer",
			code: `package main

func updateValue(ptr *int) int {
    return *ptr
}`,
			functionName: "updateValue",
			expected: &FunctionSignature{
				Name:       "updateValue",
				ParamTypes: []string{"*int"},
				ReturnType: "int",
			},
		},
		{
			name: "function_with_struct",
			code: `package main

type Person struct {
    Name string
}

func greet(p Person) string {
    return "Hello " + p.Name
}`,
			functionName: "greet",
			expected: &FunctionSignature{
				Name:       "greet",
				ParamTypes: []string{"Person"},
				ReturnType: "string",
			},
		},
		{
			name: "function_not_found",
			code: `package main

func otherFunction() int {
    return 1
}`,
			functionName: "findMedianSortedArrays",
			expected:     nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.ParseFunctionSignature(tt.code, tt.functionName)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGoSignatureParser_InferParamTypesFromSignature(t *testing.T) {
	parser := NewGoSignatureParser()

	tests := []struct {
		name         string
		code         string
		functionName string
		expected     []string
	}{
		{
			name: "infer_array_types",
			code: `package main

func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {
    return 0.0
}`,
			functionName: "findMedianSortedArrays",
			expected:     []string{"array", "array"},
		},
		{
			name: "infer_mixed_types",
			code: `package main

func solution(arr []int, count int, name string) bool {
    return true
}`,
			functionName: "solution",
			expected:     []string{"array", "int", "string"},
		},
		{
			name: "function_not_found",
			code: `package main

func otherFunction() int {
    return 1
}`,
			functionName: "solution",
			expected:     nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.InferParamTypesFromSignature(tt.code, tt.functionName)
			assert.Equal(t, tt.expected, result)
		})
	}
}
