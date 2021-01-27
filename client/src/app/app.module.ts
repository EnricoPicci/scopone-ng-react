import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MaterialModule } from './material.module';

import { CardComponent } from './components/card/card.component';
import { CardsComponent } from './components/cards/cards.component';
import { HandComponent } from './components/hand/hand.component';
import { CardsPickerDialogueComponent } from './components/hand/cards-picker-dialogue.component';
import { ErrorComponent } from './components/error/error.component';
import { GameComponent } from './components/game/game.component';
import { NewGameComponent } from './components/new-game/new-game.component';
import { PickGameComponent } from './components/pick-game/pick-game.component';
import { GameListComponent } from './components/game-list/game-list.component';
import { GamePickerDialogueComponent } from './components/game-list/game-picker-dialogue.component';
import { PlayerComponent } from './components/player/player.component';
import { TableComponent } from './components/table/table.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { ByeComponent } from './components/bye/bye.component';
import { CardsTakenDialogueComponent } from './components/hand/cards-taken-dialogue.component';
import { HandResultComponent } from './components/hand-result/hand-result.component';
import { CloseGameDialogueComponent } from './components/hand-result/close-game-dialogue.component';

@NgModule({
  declarations: [
    AppComponent,
    CardComponent,
    CardsComponent,
    HandComponent,
    CardsPickerDialogueComponent,
    ErrorComponent,
    GameComponent,
    NewGameComponent,
    PickGameComponent,
    GameListComponent,
    GamePickerDialogueComponent,
    PlayerComponent,
    TableComponent,
    SignInComponent,
    ByeComponent,
    CardsTakenDialogueComponent,
    HandResultComponent,
    CloseGameDialogueComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
  ],
  entryComponents: [
    CardsPickerDialogueComponent,
    GamePickerDialogueComponent,
    CardsTakenDialogueComponent,
    CloseGameDialogueComponent,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
