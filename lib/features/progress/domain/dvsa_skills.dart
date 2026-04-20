import 'skill.dart';

abstract final class DvsaSkills {
  static const Map<String, List<Skill>> categories = {
    'Manoeuvres': [
      Skill(id: 'parallel_parking', name: 'Parallel Parking', category: 'manoeuvres'),
      Skill(id: 'bay_parking_forward', name: 'Bay Parking (Forward)', category: 'manoeuvres'),
      Skill(id: 'bay_parking_reverse', name: 'Bay Parking (Reverse)', category: 'manoeuvres'),
      Skill(id: 'emergency_stop', name: 'Emergency Stop', category: 'manoeuvres'),
      Skill(id: 'pulling_up_right', name: 'Pulling Up on the Right', category: 'manoeuvres'),
    ],
    'Road Skills': [
      Skill(id: 'junctions', name: 'Junctions', category: 'road_skills'),
      Skill(id: 'roundabouts', name: 'Roundabouts', category: 'road_skills'),
      Skill(id: 'speed_control', name: 'Speed Control', category: 'road_skills'),
      Skill(id: 'lane_discipline', name: 'Lane Discipline', category: 'road_skills'),
      Skill(id: 'mirror_use', name: 'Mirror Use (MSM)', category: 'road_skills'),
      Skill(id: 'independent_driving', name: 'Independent Driving', category: 'road_skills'),
      Skill(id: 'dual_carriageways', name: 'Dual Carriageways', category: 'road_skills'),
      Skill(id: 'pedestrian_crossings', name: 'Pedestrian Crossings', category: 'road_skills'),
    ],
  };

  /// All 13 DVSA skills as a flat list.
  static List<Skill> get allSkills =>
      categories.values.expand((skills) => skills).toList();

  /// Returns the skill with the given [id], or null if not found.
  static Skill? getById(String id) {
    for (final skill in allSkills) {
      if (skill.id == id) return skill;
    }
    return null;
  }
}
