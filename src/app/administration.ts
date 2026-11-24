import { Component, output } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminRaceMail } from './admin-race-mail';
import { AdminRaceStatuses } from './admin-race-statuses';
import { ImportAdministration } from './import-administration';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-administration',
  imports: [MatTabsModule, AdminRaceMail, AdminRaceStatuses, ImportAdministration, TranslatePipe],
  template: `
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
  styles: ['app-import-administration, app-admin-race-statuses { display: block; padding-top: 20px; }'],
})
export class Administration {
  readonly statusChanged = output<number>();
}
