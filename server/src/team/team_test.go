package team

import (
	"go-scopone/src/player"
	"strings"
	"testing"
)

func TestName(t *testing.T) {
	n1 := "Player_1"
	n2 := "Player_2"
	p1 := player.New(n1)
	p2 := player.New(n2)
	team := New()
	team.Players[0] = p1
	team.Players[1] = p2
	teamName := Name(team)
	if !strings.Contains(teamName, n1) {
		t.Errorf("Expected %v to contain %v", teamName, n1)
	}
	if !strings.Contains(teamName, n2) {
		t.Errorf("Expected %v to contain %v", teamName, n2)
	}
}
