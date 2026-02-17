"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneNumberNormalizer = void 0;
class PhoneNumberNormalizer {
    static normalize(phone) {
        if (!phone)
            return '';
        let cleaned = phone.replace(/[^0-9+]/g, '');
        if (cleaned.indexOf('+') > 0) {
            cleaned = cleaned.replace(/\+/g, '');
        }
        if (/^998[0-9]{9}$/.test(cleaned)) {
            return `+${cleaned}`;
        }
        if (/^[0-9]{9}$/.test(cleaned)) {
            return `+998${cleaned}`;
        }
        if (cleaned.startsWith('+')) {
            return cleaned;
        }
        return `+${cleaned}`;
    }
}
exports.PhoneNumberNormalizer = PhoneNumberNormalizer;
//# sourceMappingURL=phone-normalizer.js.map