import { Component, inject } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  layoutService = inject(LayoutService);
  authService = inject(AuthService);

  getUserName() {
    return this.authService.currentUser()?.displayName || 'Visitante';
  }

  getInitials() {
    const name = this.getUserName();
    return name.charAt(0).toUpperCase();
  }
}
