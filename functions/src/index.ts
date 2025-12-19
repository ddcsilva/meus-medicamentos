/**
 * Cloud Functions para MedStock
 * Sistema de gerenciamento de medicamentos familiares
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as functionsV1 from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Inicializa o Firebase Admin
admin.initializeApp();

// Configurações globais
setGlobalOptions({maxInstances: 10, region: "southamerica-east1"});

/**
 * Define um usuário como admin
 * ATENÇÃO: Esta função deve ser chamada apenas para setup inicial
 * Idealmente, proteja esta função ou desabilite após criar o primeiro admin
 */
export const setAdmin = onCall(async (request) => {
  const {email} = request.data;

  if (!email) {
    throw new HttpsError("invalid-argument", "Email é obrigatório");
  }

  // Segurança: somente um admin já existente pode promover
  // outro admin. Bootstrap do primeiro admin deve ser feito
  // manualmente via Firebase Console/CLI.
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }
  if (request.auth.token.isAdmin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Apenas admins podem definir admin"
    );
  }

  try {
    logger.info(`Tentando definir admin para: ${email}`);

    // Busca o usuário pelo email
    const user = await admin.auth().getUserByEmail(email);

    // Define o custom claim isAdmin
    await admin.auth().setCustomUserClaims(user.uid, {isAdmin: true});

    logger.info(`Admin definido com sucesso: ${user.uid}`);

    return {
      success: true,
      uid: user.uid,
      message: `Usuário ${email} agora é admin`,
    };
  } catch (error) {
    logger.error("Erro ao definir admin:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    throw new HttpsError("internal", msg);
  }
});

/**
 * Aprova ou rejeita um usuário
 * Requer que o caller seja admin
 */
export const approveUser = onCall(async (request) => {
  // Verifica se o usuário está autenticado
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  // Verifica se o usuário é admin
  const isAdmin = request.auth.token.isAdmin === true;
  if (!isAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Apenas administradores podem aprovar usuários"
    );
  }

  const {uid, approve} = request.data;

  if (!uid || typeof approve !== "boolean") {
    throw new HttpsError(
      "invalid-argument",
      "uid e approve são obrigatórios"
    );
  }

  try {
    const action = approve ? "aprovando" : "rejeitando";
    logger.info(`Admin ${request.auth.uid} ${action} usuário ${uid}`);

    const status = approve ? "approved" : "rejected";

    // Atualiza o status do usuário no Firestore
    await admin.firestore().collection("users").doc(uid).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Usuário ${uid} agora tem status: ${status}`);

    return {
      success: true,
      uid,
      status,
      message: `Usuário ${approve ? "aprovado" : "rejeitado"} com sucesso`,
    };
  } catch (error) {
    logger.error("Erro ao atualizar status do usuário:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    throw new HttpsError("internal", msg);
  }
});

/**
 * Trigger (v1) para criar documento do usuário no Firestore
 * quando um novo usuário é criado via Auth.
 * Observação: mantemos em v1 pois o v2 Identity não oferece
 * um "after create" equivalente.
 */
export const onUserCreated = functionsV1
  .auth.user().onCreate(async (user) => {
    logger.info(`Novo usuário criado: ${user.uid}`);

    try {
    // Verifica se já existe documento no Firestore
      const userDoc = await admin
        .firestore().collection("users").doc(user.uid).get();

      if (!userDoc.exists) {
      // Cria documento se não existir
        await admin.firestore().collection("users").doc(user.uid).set({
          email: user.email || "",
          nome: user.displayName || "Usuário",
          status: "pending",
          familyId: null,
          photoURL: user.photoURL || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`Documento criado para usuário: ${user.uid}`);
      }
    } catch (error) {
      logger.error("Erro ao criar documento do usuário:", error);
    }
  });

/**
 * Entrada segura em família via inviteCode.
 * - Valida que o caller está autenticado
 * - Valida que o caller está aprovado (status='approved')
 * - Resolve a família por inviteCode e adiciona o caller em
 *   members + memberRoles
 * - Atualiza users/{uid}.familyId
 */
export const joinFamilyByInviteCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  const inviteCodeRaw = request.data?.inviteCode;
  if (!inviteCodeRaw || typeof inviteCodeRaw !== "string") {
    throw new HttpsError("invalid-argument", "inviteCode é obrigatório");
  }

  const inviteCode = inviteCodeRaw.toUpperCase().trim();
  if (!inviteCode.startsWith("FAM-") || inviteCode.length !== 10) {
    throw new HttpsError("invalid-argument", "Formato inválido de inviteCode");
  }

  const uid = request.auth.uid;

  // Verifica status aprovado
  const userRef = admin.firestore().collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError(
      "failed-precondition",
      "Perfil do usuário não encontrado"
    );
  }
  const userData = userSnap.data() as {status: string};
  if (userData.status !== "approved") {
    throw new HttpsError("permission-denied", "Usuário não aprovado");
  }

  // Resolve família por inviteCode
  const familiesQuery = await admin
    .firestore()
    .collection("families")
    .where("inviteCode", "==", inviteCode)
    .limit(1)
    .get();

  if (familiesQuery.empty) {
    throw new HttpsError("not-found", "Código de convite inválido");
  }

  const familyDoc = familiesQuery.docs[0];
  const familyRef = familyDoc.ref;

  // Transação para evitar concorrência
  await admin.firestore().runTransaction(async (tx) => {
    const freshFamilySnap = await tx.get(familyRef);
    if (!freshFamilySnap.exists) {
      throw new HttpsError("not-found", "Família não encontrada");
    }

    const family = freshFamilySnap.data() as {members?: string[]};
    const members: string[] = family.members ?? [];

    // Idempotência
    if (members.includes(uid)) {
      // Garante user.familyId consistente
      tx.update(userRef, {
        familyId: familyRef.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    // Limite de segurança (evita abuso)
    if (members.length >= 20) {
      throw new HttpsError(
        "resource-exhausted",
        "Família atingiu o limite de membros"
      );
    }

    tx.update(familyRef, {
      members: admin.firestore.FieldValue.arrayUnion(uid),
      [`memberRoles.${uid}`]: "editor",
    });

    tx.update(userRef, {
      familyId: familyRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return {
    success: true,
    familyId: familyRef.id,
  };
});
