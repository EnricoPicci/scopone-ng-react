import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HandComponent } from './components/hand/hand.component';
import { ErrorComponent } from './components/error/error.component';
import { PickGameComponent } from './components/pick-game/pick-game.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { ByeComponent } from './components/bye/bye.component';
import { HandResultComponent } from './components/hand-result/hand-result.component';

const routes: Routes = [
  { path: '', redirectTo: '/sign-in', pathMatch: 'full' },
  { path: 'sign-in', component: SignInComponent },
  { path: 'pick-game', component: PickGameComponent },
  { path: 'hand', component: HandComponent },
  { path: 'hand-result', component: HandResultComponent },
  { path: 'bye', component: ByeComponent },
  { path: 'error', component: ErrorComponent },
  // { path: '**', component: HandComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
