import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/progress/domain/dvsa_skills.dart';

void main() {
  group('DvsaSkills', () {
    test('has exactly 13 skills in total', () {
      expect(DvsaSkills.allSkills.length, 13);
    });

    test('Manoeuvres category has 5 skills', () {
      final manoeuvres = DvsaSkills.categories['Manoeuvres']!;
      expect(manoeuvres.length, 5);
    });

    test('Road Skills category has 8 skills', () {
      final roadSkills = DvsaSkills.categories['Road Skills']!;
      expect(roadSkills.length, 8);
    });

    test('allSkills contains no duplicate ids', () {
      final ids = DvsaSkills.allSkills.map((s) => s.id).toList();
      expect(ids.toSet().length, ids.length);
    });

    group('getById', () {
      test('returns skill when id exists', () {
        final skill = DvsaSkills.getById('parallel_parking');
        expect(skill, isNotNull);
        expect(skill!.name, 'Parallel Parking');
        expect(skill.category, 'manoeuvres');
      });

      test('returns skill for road_skills category', () {
        final skill = DvsaSkills.getById('junctions');
        expect(skill, isNotNull);
        expect(skill!.name, 'Junctions');
        expect(skill.category, 'road_skills');
      });

      test('returns null for unknown id', () {
        final skill = DvsaSkills.getById('nonexistent_skill');
        expect(skill, isNull);
      });

      test('can retrieve all 13 skills by their ids', () {
        for (final skill in DvsaSkills.allSkills) {
          final found = DvsaSkills.getById(skill.id);
          expect(found, isNotNull, reason: 'Could not find skill: ${skill.id}');
          expect(found!.id, skill.id);
        }
      });
    });

    test('all skills have correct isCustom=false', () {
      for (final skill in DvsaSkills.allSkills) {
        expect(skill.isCustom, isFalse, reason: '${skill.id} should not be custom');
      }
    });

    test('all skills have rating 0 by default', () {
      for (final skill in DvsaSkills.allSkills) {
        expect(skill.rating, 0, reason: '${skill.id} should have default rating 0');
      }
    });

    test('categories map has exactly 2 categories', () {
      expect(DvsaSkills.categories.keys.length, 2);
      expect(DvsaSkills.categories.keys, containsAll(['Manoeuvres', 'Road Skills']));
    });
  });
}
