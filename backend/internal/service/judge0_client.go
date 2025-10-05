package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// HTTP client timeout configuration
const (
	httpClientTimeout = 30 * time.Second
)

// judge0Request는 Judge0 API 요청에 사용되는 데이터 구조체입니다
type judge0Request struct {
	SourceCode       string `json:"source_code"`
	LanguageID       int    `json:"language_id"`
	StdIn            string `json:"stdin"`
	ExpectedOutput   string `json:"expected_output"`
	CompileTimeout   int    `json:"compile_timeout"`
	RunTimeout       int    `json:"run_timeout"`
	MemoryLimit      int    `json:"memory_limit"`
	EnableNetworking bool   `json:"enable_networking"`
}

// judge0Response는 Judge0 API 응답에 사용되는 데이터 구조체입니다
type judge0Response struct {
	Stdout       string `json:"stdout"`
	Stderr       string `json:"stderr"`
	CompileError string `json:"compile_error"`
	Status       struct {
		ID          int    `json:"id"`
		Description string `json:"description"`
	} `json:"status"`
	Memory      float64     `json:"memory"`
	Time        interface{} `json:"time"`
	CompileTime float64     `json:"compile_time"`
}

// Judge0Client Judge0 API와 통신하는 클라이언트
type Judge0Client interface {
	SubmitCode(request judge0Request) (*judge0Response, error)
}

// judge0HttpClient Judge0Client 인터페이스 구현체
type judge0HttpClient struct {
	apiKey      string
	apiEndpoint string
	httpClient  *http.Client
}

// NewJudge0Client creates a new Judge0Client instance with the provided configuration
func NewJudge0Client(apiKey string, apiEndpoint string) Judge0Client {
	return &judge0HttpClient{
		apiKey:      apiKey,
		apiEndpoint: apiEndpoint,
		httpClient: &http.Client{
			Timeout: httpClientTimeout,
		},
	}
}

// SubmitCode Judge0 API에 코드 제출 및 결과 확인
func (c *judge0HttpClient) SubmitCode(request judge0Request) (*judge0Response, error) {
	// 요청 데이터 직렬화
	reqBody, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}

	// API 요청 생성
	req, err := http.NewRequest("POST", c.apiEndpoint+"/submissions?wait=true", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}

	// 헤더 설정
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-RapidAPI-Key", c.apiKey)

	// API 요청 실행
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// 응답 처리
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// 응답이 성공적이지 않은 경우
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("judge0 API error: %s", string(body))
	}

	// 응답 JSON 파싱
	var result judge0Response
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return &result, nil
}
