import "dotenv/config";
import { pool } from "../db";
import { expireUnverifiedPublishedStores } from "../services/publishGrace";

async function run() {
  const unpublished = await expireUnverifiedPublishedStores();
  console.log(`Unpublished ${unpublished} store(s) with expired verification grace periods.`);
  await pool.end();
}

run().catch(async (error) => {
  console.error("Publish grace expiry job failed", error);
  await pool.end();
  process.exitCode = 1;
});
