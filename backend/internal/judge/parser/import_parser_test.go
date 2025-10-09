package parser

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestImportParser_ParseImports(t *testing.T) {
	parser := NewImportParser()

	tests := []struct {
		name       string
		code       string
		languageID int
		expected   *ImportInfo
	}{
		{
			name: "python_single_import",
			code: `import heapq

def solution(nums):
    heapq.heapify(nums)
    return nums`,
			languageID: 71,
			expected: &ImportInfo{
				Imports: []string{"import heapq"},
				Code:    "def solution(nums):\n    heapq.heapify(nums)\n    return nums",
			},
		},
		{
			name: "python_multiple_imports",
			code: `import heapq
import math
from collections import defaultdict

def solution(nums):
    heapq.heapify(nums)
    return nums`,
			languageID: 71,
			expected: &ImportInfo{
				Imports: []string{"import heapq", "import math", "from collections import defaultdict"},
				Code:    "def solution(nums):\n    heapq.heapify(nums)\n    return nums",
			},
		},
		{
			name: "go_single_import",
			code: `import "sort"

func solution(nums []int) []int {
    sort.Ints(nums)
    return nums
}`,
			languageID: 60,
			expected: &ImportInfo{
				Imports: []string{`import "sort"`},
				Code:    "func solution(nums []int) []int {\n    sort.Ints(nums)\n    return nums\n}",
			},
		},
		{
			name: "go_multiple_imports",
			code: `import (
    "sort"
    "strings"
)

func solution(nums []int) []int {
    sort.Ints(nums)
    return nums
}`,
			languageID: 60,
			expected: &ImportInfo{
				Imports: []string{`"sort"`, `"strings"`},
				Code:    "func solution(nums []int) []int {\n    sort.Ints(nums)\n    return nums\n}",
			},
		},
		{
			name: "javascript_require",
			code: `const fs = require('fs');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			languageID: 63,
			expected: &ImportInfo{
				Imports: []string{"const fs = require('fs');"},
				Code:    "function solution(nums) {\n    return nums.sort((a, b) => a - b);\n}",
			},
		},
		{
			name: "javascript_es6_import",
			code: `import { readFile } from 'fs';

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			languageID: 63,
			expected: &ImportInfo{
				Imports: []string{"import { readFile } from 'fs';"},
				Code:    "function solution(nums) {\n    return nums.sort((a, b) => a - b);\n}",
			},
		},
		{
			name: "java_imports",
			code: `import java.util.*;
import java.util.stream.Collectors;

public class Solution {
    public int[] solution(int[] nums) {
        Arrays.sort(nums);
        return nums;
    }
}`,
			languageID: 62,
			expected: &ImportInfo{
				Imports: []string{"import java.util.*;", "import java.util.stream.Collectors;"},
				Code:    "public class Solution {\n    public int[] solution(int[] nums) {\n        Arrays.sort(nums);\n        return nums;\n    }\n}",
			},
		},
		{
			name: "cpp_includes",
			code: `#include <algorithm>
#include <vector>

class Solution {
public:
    vector<int> solution(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        return nums;
    }
};`,
			languageID: 54,
			expected: &ImportInfo{
				Imports: []string{"#include <algorithm>", "#include <vector>"},
				Code:    "class Solution {\npublic:\n    vector<int> solution(vector<int>& nums) {\n        sort(nums.begin(), nums.end());\n        return nums;\n    }\n};",
			},
		},
		{
			name: "no_imports",
			code: `def solution(nums):
    return sorted(nums)`,
			languageID: 71,
			expected: &ImportInfo{
				Imports: []string{},
				Code:    "def solution(nums):\n    return sorted(nums)",
			},
		},
		{
			name: "unsupported_language",
			code: `def solution(nums):
    return sorted(nums)`,
			languageID: 999,
			expected: &ImportInfo{
				Imports: []string{},
				Code:    "def solution(nums):\n    return sorted(nums)",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.ParseImports(tt.code, tt.languageID)
			assert.Equal(t, tt.expected.Imports, result.Imports)
			assert.Equal(t, tt.expected.Code, result.Code)
		})
	}
}

func TestImportParser_ParsePythonImports(t *testing.T) {
	parser := NewImportParser()

	tests := []struct {
		name     string
		code     string
		expected []string
	}{
		{
			name: "import_with_space",
			code: `import heapq
import math
from collections import defaultdict`,
			expected: []string{"import heapq", "import math", "from collections import defaultdict"},
		},
		{
			name: "import_with_comments",
			code: `# This is a comment
import heapq
# Another comment
import math`,
			expected: []string{"import heapq", "import math"},
		},
		{
			name: "no_imports",
			code: `def solution():
    return 42`,
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.parsePythonImports(tt.code)
			assert.Equal(t, tt.expected, result.Imports)
		})
	}
}

func TestImportParser_ParseGoImports(t *testing.T) {
	parser := NewImportParser()

	tests := []struct {
		name     string
		code     string
		expected []string
	}{
		{
			name: "single_line_imports",
			code: `import "sort"
import "strings"`,
			expected: []string{`import "sort"`, `import "strings"`},
		},
		{
			name: "multi_line_import_block",
			code: `import (
    "sort"
    "strings"
)`,
			expected: []string{`"sort"`, `"strings"`},
		},
		{
			name: "mixed_imports",
			code: `import "fmt"
import (
    "sort"
    "strings"
)`,
			expected: []string{`import "fmt"`, `"sort"`, `"strings"`},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.parseGoImports(tt.code)
			assert.Equal(t, tt.expected, result.Imports)
		})
	}
}
