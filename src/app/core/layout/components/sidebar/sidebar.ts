import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  layoutService = inject(LayoutService);

  menuItems = [
    {
      label: 'Dashboard',
      route: '/app/dashboard',
      exact: true,
      icon: 'dashboard',
    },
    {
      label: 'Medicamentos',
      route: '/app/medications',
      exact: false,
      icon: 'medicamentos',
    },
  ];
}
