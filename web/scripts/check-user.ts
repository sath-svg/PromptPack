import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

async function main() {
  const { rows: users } = await pool.query(
    `SELECT id, email, name, "createdAt" FROM "user" WHERE LOWER(email) = 'dksathvik@gmail.com'`
  );
  console.log("BetterAuth users:", JSON.stringify(users, null, 2));

  if (users.length > 0) {
    const ids = users.map((u: any) => u.id);
    const { rows: sessions } = await pool.query(
      `SELECT id, "userId", "expiresAt" FROM session WHERE "userId" = ANY($1) ORDER BY "expiresAt" DESC LIMIT 5`,
      [ids]
    );
    console.log("\nSessions:", JSON.stringify(sessions, null, 2));

    const { rows: accounts } = await pool.query(
      `SELECT id, "userId", "providerId", "accountId" FROM account WHERE "userId" = ANY($1)`,
      [ids]
    );
    console.log("\nAccounts:", JSON.stringify(accounts, null, 2));
  }

  await pool.end();
}

main().catch(console.error);
