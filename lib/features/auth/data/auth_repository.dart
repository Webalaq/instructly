import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:instructly/features/auth/domain/app_user.dart';

class AuthRepository {
  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  AuthRepository({
    required FirebaseAuth auth,
    required FirebaseFirestore firestore,
  })  : _auth = auth,
        _firestore = firestore;

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------

  static final authRepositoryProvider = Provider<AuthRepository>((ref) {
    return AuthRepository(
      auth: FirebaseAuth.instance,
      firestore: FirebaseFirestore.instance,
    );
  });

  static final authStateProvider = StreamProvider<User?>((ref) {
    final repo = ref.watch(authRepositoryProvider);
    return repo._auth.authStateChanges();
  });

  static final currentUserProvider = FutureProvider<AppUser?>((ref) async {
    final userAsync = ref.watch(authStateProvider);
    final user = userAsync.asData?.value;
    if (user == null) return null;
    final repo = ref.watch(authRepositoryProvider);
    return repo.getCurrentUser(uid: user.uid);
  });

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /// Registers a new instructor account.
  /// Creates auth user, then batch-writes /users/{uid} and /instructors/{uid}.
  Future<AppUser?> registerInstructor({
    required String email,
    required String password,
  }) async {
    final credential = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );

    final user = credential.user;
    if (user == null) return null;

    final uid = user.uid;
    final now = DateTime.now();

    final appUser = AppUser(
      uid: uid,
      email: email,
      role: 'instructor',
      onboarded: false,
      createdAt: now,
    );

    final batch = _firestore.batch();

    batch.set(
      _firestore.collection('users').doc(uid),
      {
        ...appUser.toMap(),
        'createdAt': FieldValue.serverTimestamp(),
      },
    );

    batch.set(
      _firestore.collection('instructors').doc(uid),
      {
        'email': email,
        'uid': uid,
        'settings': {
          'lessonDuration': 60,
          'currency': 'USD',
        },
        'createdAt': FieldValue.serverTimestamp(),
      },
    );

    await batch.commit();

    return appUser;
  }

  /// Registers a new student account linked to an instructor via invite code.
  /// Creates auth user, batch-writes /users/{uid}, marks invite claimed,
  /// and creates a student record under the instructor.
  Future<AppUser?> registerStudent({
    required String email,
    required String password,
    required String inviteCode,
    required String instructorId,
  }) async {
    final credential = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );

    final user = credential.user;
    if (user == null) return null;

    final uid = user.uid;
    final now = DateTime.now();

    final appUser = AppUser(
      uid: uid,
      email: email,
      role: 'student',
      onboarded: false,
      linkedInstructorId: instructorId,
      createdAt: now,
    );

    final batch = _firestore.batch();

    // Create user doc
    batch.set(
      _firestore.collection('users').doc(uid),
      {
        ...appUser.toMap(),
        'createdAt': FieldValue.serverTimestamp(),
      },
    );

    // Mark invite as claimed
    batch.update(
      _firestore.collection('invites').doc(inviteCode),
      {
        'claimed': true,
        'claimedBy': uid,
        'claimedAt': FieldValue.serverTimestamp(),
      },
    );

    // Create student record under instructor
    batch.set(
      _firestore
          .collection('instructors')
          .doc(instructorId)
          .collection('students')
          .doc(uid),
      {
        'uid': uid,
        'email': email,
        'joinedAt': FieldValue.serverTimestamp(),
      },
    );

    await batch.commit();

    return appUser;
  }

  /// Signs in with email and password, returns the AppUser from Firestore.
  Future<AppUser?> signIn({
    required String email,
    required String password,
  }) async {
    final credential = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );

    final user = credential.user;
    if (user == null) return null;

    return getCurrentUser(uid: user.uid);
  }

  /// Reads /users/{uid} from Firestore and returns an AppUser.
  /// Uses the currently authenticated user's uid if [uid] is not provided.
  Future<AppUser?> getCurrentUser({String? uid}) async {
    final resolvedUid = uid ?? _auth.currentUser?.uid;
    if (resolvedUid == null) return null;

    final doc = await _firestore.collection('users').doc(resolvedUid).get();
    if (!doc.exists || doc.data() == null) return null;

    return AppUser.fromMap(doc.data()!, resolvedUid);
  }

  /// Signs out the current user.
  Future<void> signOut() async {
    await _auth.signOut();
  }
}
