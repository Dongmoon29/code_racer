package service

import (
	"context"
	"net"
	"strings"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

type commandCaptureHook struct {
	commands [][]interface{}
}

func (h *commandCaptureHook) DialHook(next redis.DialHook) redis.DialHook {
	return func(ctx context.Context, network, addr string) (net.Conn, error) { return next(ctx, network, addr) }
}

func (h *commandCaptureHook) ProcessHook(_ redis.ProcessHook) redis.ProcessHook {
	return func(_ context.Context, cmd redis.Cmder) error {
		h.commands = append(h.commands, cmd.Args())
		return nil
	}
}

func (h *commandCaptureHook) ProcessPipelineHook(_ redis.ProcessPipelineHook) redis.ProcessPipelineHook {
	return func(_ context.Context, cmds []redis.Cmder) error {
		for _, cmd := range cmds {
			h.commands = append(h.commands, cmd.Args())
		}
		return nil
	}
}

func TestRedisManager_UpdateMatchStatusUsesMetadataKey(t *testing.T) {
	client := redis.NewClient(&redis.Options{Addr: "unused:6379"})
	t.Cleanup(func() { _ = client.Close() })
	hook := &commandCaptureHook{}
	client.AddHook(hook)
	manager := NewRedisManager(client, testutil.SetupTestLogger())
	matchID := uuid.New()

	require.NoError(t, manager.UpdateMatchStatusContext(context.Background(), matchID, model.MatchStatusFinished))
	require.NotEmpty(t, hook.commands)
	require.Equal(t, "hset", hook.commands[0][0])
	require.Equal(t, "match:"+matchID.String()+":data", hook.commands[0][1])
	for _, arg := range hook.commands[0] {
		value, ok := arg.(string)
		if ok {
			require.False(t, value == "match:"+matchID.String() || strings.HasSuffix(value, ":"+matchID.String()), "must not write the obsolete match:{id} hash")
		}
	}
}
