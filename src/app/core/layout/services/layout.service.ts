import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  isSidebarExpanded = signal<boolean>(true);
  isMobileMenuOpen = signal<boolean>(false);

  contentMarginClass = computed(() => 
    this.isSidebarExpanded() ? 'md:ml-64' : 'md:ml-20'
  );

  toggleSidebar() {
    this.isSidebarExpanded.update(v => !v);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
}