import { Component, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { AcrhoApi } from './acrho-api.service';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminRaceMail } from './admin-race-mail';
import { AdminRaceStatuses } from './admin-race-statuses';
import { ImportAdministration } from './import-administration';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-administration',
  imports: [MatTabsModule, AdminRaceMail, AdminRaceStatuses, ImportAdministration, TranslatePipe],
  template: `
    <p class="deployed-version">
      Version déployée du backend
      @if (deployedVersion(); as build) {
        <strong>{{ build.version || 'inconnue' }}</strong>
        @if (build.commit) {
          <code [title]="build.commit">{{ build.commit.slice(0, 8) }}</code>
        }
      } @else if (deployedVersion() === null) {
        <span>indisponible</span>
      } @else {
        <span>chargement…</span>
      }
    </p>
    <mat-tab-group [preserveContent]="true" [animationDuration]="'0ms'">
      <mat-tab [label]="'Erreurs d’import' | t">
        <ng-template matTabContent>
          <app-import-administration />
        </ng-template>
      </mat-tab>
      <mat-tab [label]="'Statut des courses' | t">
        <ng-template matTabContent>
          <app-admin-race-statuses (statusChanged)="statusChanged.emit($event)" />
        </ng-template>
      </mat-tab>
      <mat-tab [label]="'Mails de résultats' | t">
        <ng-template matTabContent>
          <app-admin-race-mail />
        </ng-template>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .deployed-version { margin: 0 0 16px; color: var(--acrho-muted); }
    .deployed-version strong, .deployed-version code { margin-left: 6px; color: var(--acrho-heading); }
    app-import-administration, app-admin-race-statuses { display: block; padding-top: 20px; }
    app-import-administration, app-admin-race-statuses, app-admin-race-mail { padding-inline: 4px; }
  `],
})
export class Administration {
  readonly deployedVersion = toSignal(inject(AcrhoApi).adminVersion().pipe(catchError(() => of(null))));
  readonly statusChanged = output<number>();
}
