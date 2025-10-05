package judge

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/Dongmoon29/code_racer/internal/types"
)

// Judge0Client는 Judge0 API와의 통신을 담당합니다
type Judge0Client struct {
	apiKey      string
	apiEndpoint string
	httpClient  *http.Client
}

type Judge0Request struct {
	SourceCode       string `json:"source_code"`
	LanguageID       int    `json:"language_id"`
	StdIn            string `json:"stdin"`
	ExpectedOutput   string `json:"expected_output"`
	CompileTimeout   int    `json:"compile_timeout"`
	RunTimeout       int    `json:"run_timeout"`
	MemoryLimit      int    `json:"memory_limit"`
	EnableNetworking bool   `json:"enable_networking"`
}

func NewJudge0Client(apiKey, apiEndpoint string) *Judge0Client {
	return &Judge0Client{
		apiKey:      apiKey,
		apiEndpoint: apiEndpoint,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SubmitCode Judge0 API에 코드를 제출하고 결과를 반환합니다
func (c *Judge0Client) SubmitCode(req types.Judge0Request) (*types.Judge0Response, error) {
	// 요청 데이터 직렬화
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// API 요청 생성
	request, err := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/submissions?wait=true", c.apiEndpoint),
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// 헤더 설정
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-RapidAPI-Key", c.apiKey)
	if parsed, perr := url.Parse(c.apiEndpoint); perr == nil {
		if parsed.Host != "" {
			request.Header.Set("X-RapidAPI-Host", parsed.Host)
		}
	}

	// API 요청 실행
	resp, err := c.httpClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// 응답 바디 읽기
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// 응답 상태 코드 확인
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("judge0 API error (status %d): %s", resp.StatusCode, string(body))
	}

	// 응답 파싱
	var result types.Judge0Response
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &result, nil
}
