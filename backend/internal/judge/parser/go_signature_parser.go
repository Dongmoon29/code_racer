package parser

import (
	"go/ast"
	"go/parser"
	"go/token"
	"strings"
)

// GoSignatureParser extracts function signatures from Go code
type GoSignatureParser struct{}

func NewGoSignatureParser() *GoSignatureParser {
	return &GoSignatureParser{}
}

// FunctionSignature represents a parsed Go function signature
type FunctionSignature struct {
	Name       string
	ParamTypes []string
	ReturnType string
}

// ParseFunctionSignature extracts function signature from Go code
func (p *GoSignatureParser) ParseFunctionSignature(code string, functionName string) *FunctionSignature {
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, "", code, parser.ParseComments)
	if err != nil {
		return nil
	}

	var result *FunctionSignature
	ast.Inspect(node, func(n ast.Node) bool {
		if fn, ok := n.(*ast.FuncDecl); ok {
			if fn.Name.Name == functionName {
				result = p.extractSignature(fn)
				return false // Stop traversal
			}
		}
		return true
	})

	return result
}

// extractSignature converts ast.FuncDecl to FunctionSignature
func (p *GoSignatureParser) extractSignature(fn *ast.FuncDecl) *FunctionSignature {
	sig := &FunctionSignature{
		Name:       fn.Name.Name,
		ParamTypes: make([]string, 0),
		ReturnType: "interface{}",
	}

	// Extract parameter types
	if fn.Type.Params != nil {
		for _, param := range fn.Type.Params.List {
			for range param.Names {
				typeStr := p.typeToString(param.Type)
				sig.ParamTypes = append(sig.ParamTypes, typeStr)
			}
		}
	}

	// Extract return type
	if fn.Type.Results != nil && len(fn.Type.Results.List) > 0 {
		sig.ReturnType = p.typeToString(fn.Type.Results.List[0].Type)
	}

	return sig
}

// typeToString converts ast.Expr to string representation
func (p *GoSignatureParser) typeToString(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.ArrayType:
		elementType := p.typeToString(t.Elt)
		return "[]" + elementType
	case *ast.StarExpr:
		return "*" + p.typeToString(t.X)
	case *ast.SelectorExpr:
		return p.typeToString(t.X) + "." + t.Sel.Name
	default:
		return "interface{}"
	}
}

// InferParamTypesFromSignature infers parameter types from function signature
func (p *GoSignatureParser) InferParamTypesFromSignature(code string, functionName string) []string {
	// Ensure code has package declaration for proper parsing
	if !strings.Contains(code, "package ") {
		code = "package main\n\n" + code
	}

	sig := p.ParseFunctionSignature(code, functionName)
	if sig == nil {
		return nil
	}

	// Convert Go types to wrapper-expected types
	wrapperTypes := make([]string, len(sig.ParamTypes))
	for i, goType := range sig.ParamTypes {
		switch goType {
		case "int":
			wrapperTypes[i] = "int"
		case "float64":
			wrapperTypes[i] = "float"
		case "bool":
			wrapperTypes[i] = "bool"
		case "string":
			wrapperTypes[i] = "string"
		case "[]int":
			wrapperTypes[i] = "array"
		default:
			if strings.HasPrefix(goType, "[]") {
				wrapperTypes[i] = "array"
			} else {
				wrapperTypes[i] = "int" // Default fallback
			}
		}
	}

	return wrapperTypes
}
