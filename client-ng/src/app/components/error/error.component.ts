import { Component, OnInit } from '@angular/core';
import { ErrorService } from 'src/app/errors/error-service';
import { ScoponeError } from 'src/app/errors/scopone-errors';
import { Router } from '@angular/router';

@Component({
  selector: 'scopone-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css'],
})
export class ErrorComponent implements OnInit {
  error: ScoponeError;
  constructor(private errorService: ErrorService, private router: Router) {}

  ngOnInit(): void {
    if (this.errorService.error) {
      this.error = this.errorService.error;
    } else {
      // the error message is null in case we reload the this component not using the home url
      // in this case we jump to the home page
      this.router.navigate(['']);
    }
  }
}
