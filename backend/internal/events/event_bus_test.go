package events

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestEventBusUnsubscribeRemovesOnlyTargetHandler(t *testing.T) {
	bus := NewEventBus()
	first, second := 0, 0
	unsubscribe := bus.Subscribe("topic", func(interface{}) { first++ })
	bus.Subscribe("topic", func(interface{}) { second++ })

	bus.Publish("topic", nil)
	unsubscribe()
	bus.Publish("topic", nil)

	assert.Equal(t, 1, first)
	assert.Equal(t, 2, second)
}
