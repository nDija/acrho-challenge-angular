import { Component, computed, input } from '@angular/core';

const podiumMedals = new Map([
  [1, 'assets/podium/gold.png'],
  [2, 'assets/podium/silver.png'],
  [3, 'assets/podium/bronze.png'],
]);

@Component({
  selector: 'app-ranked-runner-avatar',
  host: { 'aria-hidden': 'true', '[class.podium-avatar]': 'medal()' },
  template: `
    @if (medal(); as medalUrl) {
      <img class="podium-medal" [src]="medalUrl" alt="">
    }
    <div class="runner-avatar result-avatar">
      @let profile = runner();
      @if (profile.pictureUrl && !failedPictures().has(profile.pictureUrl)) {
        <img [src]="profile.pictureUrl" alt="" loading="lazy" referrerpolicy="no-referrer"
             (error)="failedPictures().add(profile.pictureUrl)">
      } @else {
        {{ profile.firstName[0] }}{{ profile.lastName[0] }}
      }
    </div>
  `,
  styles: `
    :host { display: block; flex: none; }
    .result-avatar { width: 38px; height: 38px; }
    :host(.podium-avatar) {
      position: relative;
      display: grid;
      place-items: center;
      width: 58px;
      height: 49px;
    }
    .podium-medal {
      position: absolute;
      inset: 0;
      width: 54px;
      height: 46px;
      margin: auto;
      transform: translateY(-2px);
    }
    :host(.podium-avatar) .result-avatar { position: relative; transform: translateY(-4px); }
  `,
})
export class RankedRunnerAvatar {
  readonly runner = input.required<{ firstName: string; lastName: string; pictureUrl?: string | null }>();
  readonly rank = input.required<number | null | undefined>();
  readonly failedPictures = input.required<Set<string>>();
  protected readonly medal = computed(() => podiumMedals.get(this.rank() ?? 0));
}
