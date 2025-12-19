import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';

/**
 * Dashboard administrativo
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);

  stats = signal({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.loadStats();
  }

  async loadStats(): Promise<void> {
    this.isLoading.set(true);
    try {
      const stats = await this.adminService.getUserStats();
      this.stats.set(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateToPendingUsers(): void {
    this.router.navigate(['/admin/pending-users']);
  }
}
