import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/shared/utils/validators.dart';

void main() {
  group('Validators', () {
    group('required', () {
      test('returns null for non-empty string', () {
        expect(Validators.required('hello'), isNull);
      });

      test('returns error for null', () {
        expect(Validators.required(null), isNotNull);
      });

      test('returns error for empty string', () {
        expect(Validators.required(''), isNotNull);
      });

      test('returns error for whitespace-only string', () {
        expect(Validators.required('   '), isNotNull);
      });

      test('returns null for string with content', () {
        expect(Validators.required('  hello  '), isNull);
      });
    });

    group('email', () {
      test('returns null for valid email', () {
        expect(Validators.email('user@example.com'), isNull);
      });

      test('returns null for email with subdomain', () {
        expect(Validators.email('user@mail.example.co.uk'), isNull);
      });

      test('returns null for email with dots and plus', () {
        expect(Validators.email('user.name+tag@example.com'), isNull);
      });

      test('returns error for null', () {
        expect(Validators.email(null), isNotNull);
      });

      test('returns error for empty string', () {
        expect(Validators.email(''), isNotNull);
      });

      test('returns error for missing @', () {
        expect(Validators.email('userexample.com'), isNotNull);
      });

      test('returns error for missing domain', () {
        expect(Validators.email('user@'), isNotNull);
      });

      test('returns error for missing TLD', () {
        expect(Validators.email('user@example'), isNotNull);
      });

      test('returns error for whitespace-only', () {
        expect(Validators.email('   '), isNotNull);
      });
    });

    group('password', () {
      test('returns null for password with 8+ chars', () {
        expect(Validators.password('password'), isNull);
      });

      test('returns null for long password', () {
        expect(Validators.password('supersecurepassword123'), isNull);
      });

      test('returns error for null', () {
        expect(Validators.password(null), isNotNull);
      });

      test('returns error for empty string', () {
        expect(Validators.password(''), isNotNull);
      });

      test('returns error for 7 char password', () {
        expect(Validators.password('1234567'), isNotNull);
      });

      test('returns null for exactly 8 chars', () {
        expect(Validators.password('12345678'), isNull);
      });
    });

    group('phone', () {
      test('returns null for valid UK mobile with +44', () {
        expect(Validators.phone('+447911123456'), isNull);
      });

      test('returns null for valid UK mobile starting with 07', () {
        expect(Validators.phone('07911123456'), isNull);
      });

      test('returns null for number with spaces (stripped before matching)', () {
        expect(Validators.phone('+44 7911 123456'), isNull);
      });

      test('returns null for 07 number with spaces', () {
        expect(Validators.phone('07911 123456'), isNull);
      });

      test('returns error for null', () {
        expect(Validators.phone(null), isNotNull);
      });

      test('returns error for empty string', () {
        expect(Validators.phone(''), isNotNull);
      });

      test('returns error for non-UK number', () {
        expect(Validators.phone('+1234567890'), isNotNull);
      });

      test('returns error for too short number', () {
        expect(Validators.phone('0791112345'), isNotNull);
      });

      test('returns error for landline number', () {
        expect(Validators.phone('02071234567'), isNotNull);
      });
    });
  });
}
