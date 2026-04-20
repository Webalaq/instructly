import 'package:cloud_firestore/cloud_firestore.dart';

class Skill {
  final String id;
  final String name;
  final String category;
  final int rating; // 0–5
  final DateTime? lastUpdated;
  final String? instructorNotes;
  final bool isCustom;

  const Skill({
    required this.id,
    required this.name,
    required this.category,
    this.rating = 0,
    this.lastUpdated,
    this.instructorNotes,
    this.isCustom = false,
  });

  /// Human-readable label for the current rating.
  String get ratingLabel {
    switch (rating) {
      case 0:
        return 'Not rated';
      case 1:
        return 'Not introduced';
      case 2:
        return 'Needs work';
      case 3:
        return 'Developing';
      case 4:
        return 'Competent';
      case 5:
        return 'Test ready';
      default:
        return 'Not rated';
    }
  }

  factory Skill.fromMap(Map<String, dynamic> map, String id) {
    final lastUpdatedRaw = map['lastUpdated'];
    DateTime? lastUpdated;
    if (lastUpdatedRaw is Timestamp) {
      lastUpdated = lastUpdatedRaw.toDate();
    } else if (lastUpdatedRaw is DateTime) {
      lastUpdated = lastUpdatedRaw;
    }

    return Skill(
      id: id,
      name: map['name'] as String? ?? '',
      category: map['category'] as String? ?? 'custom',
      rating: map['rating'] as int? ?? 0,
      lastUpdated: lastUpdated,
      instructorNotes: map['instructorNotes'] as String?,
      isCustom: map['isCustom'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'category': category,
      'rating': rating,
      if (lastUpdated != null) 'lastUpdated': lastUpdated,
      if (instructorNotes != null) 'instructorNotes': instructorNotes,
      'isCustom': isCustom,
    };
  }

  Skill copyWith({
    String? id,
    String? name,
    String? category,
    int? rating,
    DateTime? lastUpdated,
    String? instructorNotes,
    bool? isCustom,
  }) {
    return Skill(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      rating: rating ?? this.rating,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      instructorNotes: instructorNotes ?? this.instructorNotes,
      isCustom: isCustom ?? this.isCustom,
    );
  }
}
