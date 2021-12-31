package player

import (
	"testing"
)

func TestNewPlayer(t *testing.T) {
	name := "Player Name"
	p := New(name)
	if p.Name != name {
		t.Errorf("Expected name %v is rather %v", name, p.Name)
	}
}
