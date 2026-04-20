import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Investment, InvestmentRequest, PaymentInitResponse, Portfolio } from '../models/investment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvestmentService {
  private readonly base = `${environment.apiUrl}/investments`;

  constructor(private http: HttpClient) {}

  invest(payload: InvestmentRequest): Observable<PaymentInitResponse> {
    return this.http.post<PaymentInitResponse>(this.base, payload);
  }

  getPortfolio(): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.base}/portfolio`);
  }

  getHistory(): Observable<Investment[]> {
    return this.http.get<Investment[]>(`${this.base}/history`);
  }
}
