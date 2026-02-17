export class PhoneNumberNormalizer {
  /**
   * Normalizes a phone number to the standard format +998XXXXXXXXX.
   * Removes all non-digit characters.
   * If it starts with 998 but no plus, adds plus.
   * If it starts with 9 digits (local format without code), adds +998.
   *
   * @param phone The raw phone number string
   * @returns Normalized phone number
   */
  static normalize(phone: string): string {
    if (!phone) return '';

    // Remove all non-numeric characters except the leading '+'
    let cleaned = phone.replace(/[^0-9+]/g, '');

    // If it has a plus but maybe in the wrong place or multiple, keep only leading
    if (cleaned.indexOf('+') > 0) {
      cleaned = cleaned.replace(/\+/g, '');
    }

    // Check if it's already in international format without + (e.g., 998901234567)
    if (/^998[0-9]{9}$/.test(cleaned)) {
      return `+${cleaned}`;
    }

    // Check if it is local format (e.g., 901234567)
    if (/^[0-9]{9}$/.test(cleaned)) {
      return `+998${cleaned}`;
    }

    // If it already has +, ensure it matches expected length/format if needed, 
    // but specific logic for generic numbers might just return cleaned.
    // For this context, we assume primarily Uzbek numbers but robust execution.
    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    // Fallback: add + if it looks like a full number
    return `+${cleaned}`;
  }
}
