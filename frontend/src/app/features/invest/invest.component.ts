import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../core/services/project.service';
import { InvestmentService } from '../../core/services/investment.service';
import { Project } from '../../core/models/project.model';
import { PaymentInitResponse } from '../../core/models/investment.model';

type Step = 'amount' | 'contract' | 'payment' | 'confirmation';

@Component({
  selector: 'app-invest',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invest.component.html',
})
export class InvestComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private investmentService = inject(InvestmentService);

  project = signal<Project | null>(null);
  step = signal<Step>('amount');
  loading = signal(false);
  error = signal<string | null>(null);
  paymentResult = signal<PaymentInitResponse | null>(null);

  form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(1000)]],
    contractAccepted: [false, [Validators.requiredTrue]],
  });

  ngOnInit(): void {
    const projectId = +this.route.snapshot.params['projectId'];
    this.projectService.getProject(projectId).subscribe({
      next: (p) => {
        this.project.set(p);
        this.form.patchValue({ amount: p.minInvestmentAmount });
      },
      error: () => this.router.navigate(['/projects']),
    });
  }

  get ownershipPreview(): number {
    const amount = this.form.value.amount ?? 0;
    const target = this.project()?.targetAmount ?? 1;
    return (amount / target) * 100;
  }

  nextStep(): void {
    if (this.step() === 'amount') this.step.set('contract');
    else if (this.step() === 'contract') this.submitInvestment();
  }

  submitInvestment(): void {
    if (this.form.invalid || !this.project()) return;
    this.loading.set(true);
    this.error.set(null);

    this.investmentService.invest({
      projectId: this.project()!.id,
      amount: this.form.value.amount!,
      contractAccepted: true,
    }).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.paymentResult.set(result);
        this.step.set('payment');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail ?? 'Erreur lors de l\'initiation du paiement.');
      },
    });
  }

  /** En prod: polling du statut. En simulation: redirection directe après 3s */
  onPaymentDone(): void {
    this.step.set('confirmation');
  }
}
