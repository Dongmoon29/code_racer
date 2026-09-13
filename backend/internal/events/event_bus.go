package events

import (
	"sync"
)

// EventBus provides a simple pub/sub mechanism with string topics and typed payloads
type EventBus interface {
	Subscribe(topic string, handler func(payload interface{})) (unsubscribe func())
	Publish(topic string, payload interface{})
}

type eventBus struct {
	mu       sync.RWMutex
	nextID   uint64
	handlers map[string][]subscription
}

type subscription struct {
	id      uint64
	handler func(interface{})
}

// NewEventBus creates a new in-memory event bus
func NewEventBus() EventBus {
	return &eventBus{handlers: make(map[string][]subscription)}
}

// Subscribe registers a handler for a topic and returns an unsubscribe function
func (b *eventBus) Subscribe(topic string, handler func(payload interface{})) (unsubscribe func()) {
	b.mu.Lock()
	b.nextID++
	id := b.nextID
	b.handlers[topic] = append(b.handlers[topic], subscription{id: id, handler: handler})
	b.mu.Unlock()

	return func() {
		b.mu.Lock()
		defer b.mu.Unlock()
		handlers := b.handlers[topic]
		for i, entry := range handlers {
			if entry.id == id {
				b.handlers[topic] = append(handlers[:i], handlers[i+1:]...)
				break
			}
		}
	}
}

// Publish emits an event to all subscribers of a topic (handlers run synchronously)
func (b *eventBus) Publish(topic string, payload interface{}) {
	b.mu.RLock()
	handlers := append([]subscription{}, b.handlers[topic]...)
	b.mu.RUnlock()

	for _, entry := range handlers {
		entry.handler(payload)
	}
}

// Topic names
const (
	TopicMatchCreated        = "match.created"
	TopicGameFinished        = "match.finished"
	TopicSubmissionStarted   = "submission.started"
	TopicTestCaseRunning     = "testcase.running"
	TopicTestCaseCompleted   = "testcase.completed"
	TopicSubmissionCompleted = "submission.completed"
	TopicSubmissionFailed    = "submission.failed"
	TopicJudge0Timeout       = "judge0.timeout"
	TopicJudge0Quota         = "judge0.quota"
)
