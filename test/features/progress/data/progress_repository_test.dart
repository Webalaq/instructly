import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:instructly/features/progress/data/progress_repository.dart';
import 'package:instructly/features/progress/domain/dvsa_skills.dart';
import 'package:instructly/features/progress/domain/skill.dart';

void main() {
  group('ProgressRepository', () {
    late FakeFirebaseFirestore fakeFirestore;
    late ProgressRepository repository;
    const instructorId = 'instructor-123';
    const studentId = 'student-456';

    setUp(() {
      fakeFirestore = FakeFirebaseFirestore();
      repository = ProgressRepository(
        firestore: fakeFirestore,
        instructorId: instructorId,
      );
    });

    CollectionReference<Map<String, dynamic>> progressCol() =>
        fakeFirestore
            .collection('instructors')
            .doc(instructorId)
            .collection('students')
            .doc(studentId)
            .collection('progress');

    // -------------------------------------------------------------------------
    // updateSkillRating
    // -------------------------------------------------------------------------
    group('updateSkillRating', () {
      test('creates skill document with correct fields', () async {
        await repository.updateSkillRating(
          studentId: studentId,
          skillId: 'junctions',
          skillName: 'Junctions',
          category: 'road_skills',
          rating: 3,
          notes: 'Improving at T-junctions',
        );

        final doc = await progressCol().doc('junctions').get();
        expect(doc.exists, isTrue);

        final data = doc.data()!;
        expect(data['name'], 'Junctions');
        expect(data['category'], 'road_skills');
        expect(data['rating'], 3);
        expect(data['instructorNotes'], 'Improving at T-junctions');
        expect(data['isCustom'], isFalse);
        expect(data['lastUpdated'], isNotNull);
      });

      test('updates existing skill document rating', () async {
        // Create initial
        await repository.updateSkillRating(
          studentId: studentId,
          skillId: 'junctions',
          skillName: 'Junctions',
          category: 'road_skills',
          rating: 2,
        );

        // Update
        await repository.updateSkillRating(
          studentId: studentId,
          skillId: 'junctions',
          skillName: 'Junctions',
          category: 'road_skills',
          rating: 4,
          notes: 'Great progress',
        );

        final doc = await progressCol().doc('junctions').get();
        expect(doc.data()!['rating'], 4);
        expect(doc.data()!['instructorNotes'], 'Great progress');
      });

      test('creates skill without optional notes', () async {
        await repository.updateSkillRating(
          studentId: studentId,
          skillId: 'roundabouts',
          skillName: 'Roundabouts',
          category: 'road_skills',
          rating: 5,
        );

        final doc = await progressCol().doc('roundabouts').get();
        expect(doc.exists, isTrue);
        expect(doc.data()!.containsKey('instructorNotes'), isFalse);
      });
    });

    // -------------------------------------------------------------------------
    // getProgress
    // -------------------------------------------------------------------------
    group('getProgress', () {
      test('returns empty list when no skills exist', () async {
        final stream = repository.getProgress(studentId);
        final skills = await stream.first;
        expect(skills, isEmpty);
      });

      test('returns list of Skill objects', () async {
        await progressCol().doc('junctions').set({
          'name': 'Junctions',
          'category': 'road_skills',
          'rating': 3,
          'isCustom': false,
        });

        final stream = repository.getProgress(studentId);
        final skills = await stream.first;

        expect(skills, isA<List<Skill>>());
        expect(skills.length, 1);
        expect(skills.first.name, 'Junctions');
        expect(skills.first.rating, 3);
      });

      test('returns skills sorted by name', () async {
        await progressCol().doc('roundabouts').set({
          'name': 'Roundabouts',
          'category': 'road_skills',
          'rating': 2,
          'isCustom': false,
        });
        await progressCol().doc('junctions').set({
          'name': 'Junctions',
          'category': 'road_skills',
          'rating': 4,
          'isCustom': false,
        });
        await progressCol().doc('parallel_parking').set({
          'name': 'Parallel Parking',
          'category': 'manoeuvres',
          'rating': 1,
          'isCustom': false,
        });

        final stream = repository.getProgress(studentId);
        final skills = await stream.first;

        expect(skills.length, 3);
        final names = skills.map((s) => s.name).toList();
        expect(names, equals(['Junctions', 'Parallel Parking', 'Roundabouts']));
      });
    });

    // -------------------------------------------------------------------------
    // initializeDefaultSkills
    // -------------------------------------------------------------------------
    group('initializeDefaultSkills', () {
      test('creates all 13 DVSA skills', () async {
        await repository.initializeDefaultSkills(studentId);

        final snapshot = await progressCol().get();
        expect(snapshot.docs.length, 13);
      });

      test('all initialized skills have rating 0', () async {
        await repository.initializeDefaultSkills(studentId);

        final snapshot = await progressCol().get();
        for (final doc in snapshot.docs) {
          expect(doc.data()['rating'], 0, reason: '${doc.id} should have rating 0');
        }
      });

      test('all initialized skills have isCustom=false', () async {
        await repository.initializeDefaultSkills(studentId);

        final snapshot = await progressCol().get();
        for (final doc in snapshot.docs) {
          expect(doc.data()['isCustom'], isFalse);
        }
      });

      test('creates skills with correct ids matching DvsaSkills', () async {
        await repository.initializeDefaultSkills(studentId);

        final snapshot = await progressCol().get();
        final createdIds = snapshot.docs.map((d) => d.id).toSet();
        final expectedIds = DvsaSkills.allSkills.map((s) => s.id).toSet();

        expect(createdIds, equals(expectedIds));
      });

      test('does not overwrite existing skill ratings (merge)', () async {
        // Manually set a rating
        await progressCol().doc('junctions').set({
          'name': 'Junctions',
          'category': 'road_skills',
          'rating': 4,
          'isCustom': false,
        });

        await repository.initializeDefaultSkills(studentId);

        final doc = await progressCol().doc('junctions').get();
        expect(doc.data()!['rating'], 4);
      });
    });

    // -------------------------------------------------------------------------
    // addCustomSkill
    // -------------------------------------------------------------------------
    group('addCustomSkill', () {
      test('adds a custom skill document', () async {
        await repository.addCustomSkill(
          studentId: studentId,
          name: 'Hill Starts',
          category: 'custom',
        );

        final snapshot = await progressCol().get();
        expect(snapshot.docs.length, 1);

        final data = snapshot.docs.first.data();
        expect(data['name'], 'Hill Starts');
        expect(data['category'], 'custom');
        expect(data['rating'], 0);
        expect(data['isCustom'], isTrue);
      });
    });
  });
}
