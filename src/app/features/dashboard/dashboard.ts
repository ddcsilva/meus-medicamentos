import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  authService = inject(AuthService);
  today = new Date();

  getFirstName(): string {
    const fullName = this.authService.currentUser()?.displayName || '';
    return fullName.split(' ')[0] || 'Visitante';
  }
}
