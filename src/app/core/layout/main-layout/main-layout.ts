import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { LayoutService } from '../services/layout.service';
import { Sidebar } from '../components/sidebar/sidebar';
import { Header } from '../components/header/header';
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Header, NgClass],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  layoutService = inject(LayoutService);
}
