"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const phone_normalizer_1 = require("../src/common/utils/phone-normalizer");
describe('PhoneNumberNormalizer', () => {
    it('should normalize standard local number (901234567) to +998901234567', () => {
        expect(phone_normalizer_1.PhoneNumberNormalizer.normalize('901234567')).toBe('+998901234567');
    });
    it('should normalize number with 998 prefix (998901234567) to +998901234567', () => {
        expect(phone_normalizer_1.PhoneNumberNormalizer.normalize('998901234567')).toBe('+998901234567');
    });
    it('should normalize number with spaces (+998 90 123 45 67) to +998901234567', () => {
        expect(phone_normalizer_1.PhoneNumberNormalizer.normalize('+998 90 123 45 67')).toBe('+998901234567');
    });
    it('should normalize number with dashes (+998-90-123-45-67) to +998901234567', () => {
        expect(phone_normalizer_1.PhoneNumberNormalizer.normalize('+998-90-123-45-67')).toBe('+998901234567');
    });
    it('should handle already normalized numbers correctly', () => {
        expect(phone_normalizer_1.PhoneNumberNormalizer.normalize('+998901234567')).toBe('+998901234567');
    });
    it('should return empty string for empty input', () => {
        expect(phone_normalizer_1.PhoneNumberNormalizer.normalize('')).toBe('');
    });
});
//# sourceMappingURL=phone-normalizer.spec.js.map