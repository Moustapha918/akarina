import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  currentUser = signal<AdminUser | null>(null);
  isLoading = signal(true);

  private auth = getAuth();
  private db = getFirestore();

  constructor() {
    onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(this.db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data()['role'] === 'ADMIN') {
          this.currentUser.set({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            name: userDoc.data()['name'] ?? firebaseUser.email ?? '',
            role: userDoc.data()['role']
          });
        } else {
          this.currentUser.set(null);
        }
      } else {
        this.currentUser.set(null);
      }
      this.isLoading.set(false);
    });
  }

  async login(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    const userDoc = await getDoc(doc(this.db, 'users', credential.user.uid));
    if (!userDoc.exists() || userDoc.data()['role'] !== 'ADMIN') {
      await signOut(this.auth);
      throw new Error('Accès réservé aux administrateurs');
    }
    this.currentUser.set({
      uid: credential.user.uid,
      email: credential.user.email ?? '',
      name: userDoc.data()['name'] ?? credential.user.email ?? '',
      role: userDoc.data()['role']
    });
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}
