import { Pipe, PipeTransform } from '@angular/core';

const clubInitials = new Set(['AC', 'RC', 'ACRHO']);

@Pipe({ name: 'clubName' })
export class ClubNamePipe implements PipeTransform {
  transform(value?: string | null): string {
    const name = (value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim();
    const lower = name.toLocaleLowerCase('fr');
    const upper = name.toLocaleUpperCase('fr');
    if ((name !== lower && name !== upper) || /^[A-Z]{2,5}$/.test(name)) {
      return name;
    }

    return lower.replace(/\p{L}+/gu, word => {
      const uppercase = word.toLocaleUpperCase('fr');
      return clubInitials.has(uppercase) ? uppercase : word.charAt(0).toLocaleUpperCase('fr') + word.slice(1);
    });
  }
}
