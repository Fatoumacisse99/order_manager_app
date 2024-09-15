const pool = require("./db");

async function getCustomers() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute("SELECT * FROM customers");
    return rows;
  } catch (error) {
    console.error("Erreur lors de la récupération des clients:", error.message);
    throw new Error("Erreur lors de la récupération des clients.");
  } finally {
    connection.release();
  }
}

module.exports = { getCustomers };
