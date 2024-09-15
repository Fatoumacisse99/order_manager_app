const pool = require("./db");

// Fonction pour valider une date au format YYYY-MM-DD
function isValidDate(date) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date) && !isNaN(new Date(date).getTime());
}

// Fonction pour valider un montant
function isValidAmount(amount) {
  return typeof amount === 'number' && amount >= 0;
}

// Fonction pour obtenir tous les paiements
async function getPayments() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute("SELECT * FROM payments");
    return rows;
  } catch (error) {
    console.error("Erreur lors de la récupération des paiements:", error.message);
    throw new Error("Erreur lors de la récupération des paiements.");
  } finally {
    connection.release();
  }
}

// Fonction pour ajouter un paiement
async function addPayment(orderId, date, amount, paymentMethod, status) {
  // Validation des champs obligatoires
  if (!orderId || !date || !amount || !paymentMethod) {
    throw new Error("Tous les champs (orderId, date, amount, paymentMethod) sont obligatoires.");
  }

  // Validation de la date
  if (!isValidDate(date)) {
    throw new Error("Erreur : la date n'est pas valide. Format attendu : YYYY-MM-DD.");
  }

  // Validation du montant
  if (!isValidAmount(amount)) {
    throw new Error("Erreur : le montant doit être un nombre positif.");
  }

  const connection = await pool.getConnection();
  try {
    // Vérifier si la commande existe
    if (!(await orderExists(orderId))) {
      throw new Error(`Erreur : l'ID de la commande ${orderId} n'existe pas.`);
    }

    const [result] = await connection.execute(
      "INSERT INTO payments (order_id, date, amount, payment_method, status) VALUES (?, ?, ?, ?, ?)",
      [orderId, date, amount, paymentMethod, status || null]
    );
    return result.insertId;
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      throw new Error(`Erreur : la commande avec l'ID ${orderId} n'existe pas.`);
    }
    console.error("Erreur lors de l'ajout du paiement:", error.message);
    throw new Error("Erreur lors de l'ajout du paiement.");
  } finally {
    connection.release();
  }
}

// Fonction pour mettre à jour un paiement
async function updatePayment(id, orderId, date, amount, paymentMethod, status) {
  // Validation des champs obligatoires
  if (!orderId || !date || !amount || !paymentMethod) {
    throw new Error("Tous les champs (orderId, date, amount, paymentMethod) sont obligatoires.");
  }

  // Validation de la date
  if (!isValidDate(date)) {
    throw new Error("Erreur : la date n'est pas valide. Format attendu : YYYY-MM-DD.");
  }

  // Validation du montant
  if (!isValidAmount(amount)) {
    throw new Error("Erreur : le montant doit être un nombre positif.");
  }

  // Vérifier si le paiement existe
  if (!(await paymentExists(id))) {
    throw new Error(`Erreur : l'ID du paiement ${id} n'existe pas.`);
  }

  // Vérifier si la commande existe
  if (!(await orderExists(orderId))) {
    throw new Error(`Erreur : l'ID de la commande ${orderId} n'existe pas.`);
  }

  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      "UPDATE payments SET order_id = ?, date = ?, amount = ?, payment_method = ?, status = ? WHERE id = ?",
      [orderId, date, amount, paymentMethod, status || null, id]
    );
    if (result.affectedRows === 0) {
      throw new Error(`Erreur : Aucun paiement trouvé avec l'ID ${id}.`);
    }
    return result.affectedRows;
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      throw new Error(`Erreur : la commande avec l'ID ${orderId} n'existe pas.`);
    }
    console.error("Erreur lors de la mise à jour du paiement:", error.message);
    throw new Error("Erreur lors de la mise à jour du paiement.");
  } finally {
    connection.release();
  }
}

// Fonction pour supprimer un paiement
async function deletePayment(id) {
  if (!id) {
    throw new Error("ID obligatoire pour pouvoir supprimer un paiement.");
  }

  // Vérifier si le paiement existe
  if (!(await paymentExists(id))) {
    throw new Error(`Erreur : l'ID du paiement ${id} n'existe pas.`);
  }

  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute("DELETE FROM payments WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      throw new Error(`Erreur : Aucun paiement trouvé avec l'ID ${id}.`);
    }
    return result.affectedRows;
  } catch (error) {
    console.error("Erreur lors de la suppression du paiement:", error.message);
    throw new Error("Erreur lors de la suppression du paiement.");
  } finally {
    connection.release();
  }
}

// Fonction pour vérifier si un paiement existe
async function paymentExists(id) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute("SELECT 1 FROM payments WHERE id = ?", [id]);
    return rows.length > 0;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'existence du paiement:", error.message);
    throw new Error("Erreur lors de la vérification de l'existence du paiement.");
  } finally {
    connection.release();
  }
}

// Fonction pour vérifier si une commande existe
async function orderExists(id) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute("SELECT 1 FROM purchase_orders WHERE id = ?", [id]);
    return rows.length > 0;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'existence de la commande:", error.message);
    throw new Error("Erreur lors de la vérification de l'existence de la commande.");
  } finally {
    connection.release();
  }
}

module.exports = { getPayments, addPayment, updatePayment, deletePayment };
