import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

interface ClaimInviteRequest {
  code: string;
}

interface ClaimInviteResponse {
  instructorId: string;
}

/**
 * HTTPS Callable: validates a student invite code and returns the instructorId.
 *
 * Expected request data: { code: string }
 * Returns: { instructorId: string }
 *
 * Throws HttpsError if:
 *  - No code provided
 *  - Code does not exist
 *  - Code has already been claimed
 *  - Code has expired
 */
export const claimInvite = functions.https.onCall(
  async (
    data: ClaimInviteRequest,
    _context
  ): Promise<ClaimInviteResponse> => {
    const { code } = data;

    if (!code || typeof code !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "An invite code is required."
      );
    }

    const db = admin.firestore();

    // Search all instructors for the invite code
    const instructorsSnap = await db.collection("instructors").get();

    for (const instructorDoc of instructorsSnap.docs) {
      const inviteRef = db
        .collection("instructors")
        .doc(instructorDoc.id)
        .collection("invites")
        .doc(code.toUpperCase());

      const inviteSnap = await inviteRef.get();

      if (!inviteSnap.exists) continue;

      const invite = inviteSnap.data()!;

      if (invite.claimed === true) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "This invite code has already been claimed."
        );
      }

      // Check expiry
      const expiresAt: admin.firestore.Timestamp | undefined = invite.expiresAt;
      if (expiresAt && expiresAt.toDate() < new Date()) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "This invite code has expired."
        );
      }

      const instructorId: string = invite.instructorId ?? instructorDoc.id;

      console.log(
        `claimInvite: code=${code} resolved to instructorId=${instructorId}`
      );

      return { instructorId };
    }

    throw new functions.https.HttpsError(
      "not-found",
      "Invite code not found. Please check and try again."
    );
  }
);
