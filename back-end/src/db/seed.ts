import { db } from "./index";
import { goalCompletions, goals, users } from "./schema";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { PoolClient } from 'pg';
import { eq } from "drizzle-orm";

dayjs.extend(utc);
dayjs.extend(timezone);

// Função para criar as tabelas se elas não existirem
async function createTables(client: PoolClient) {
  // Cria a tabela users se ela não existir
  await client`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  // Cria a tabela goals se ela não existir
  await client`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL,
      desired_weekly_frequency INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  // Cria a tabela goal_completions se ela não existir
  await client`
    CREATE TABLE IF NOT EXISTS goal_completions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
}

// Função que insere dados nas tabelas
export async function seed() {
  // Verifica se o usuário já existe
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, 'user@example.com'))
    .limit(1);

  if (!existingUser.length) {
    // Cria um usuário padrão para o seed
    const [user] = await db
      .insert(users)
      .values({
        email: 'user@example.com',
        passwordHash: 'hashedpassword',
      })
      .returning();

    // Insere novas metas associadas ao usuário
    const result = await db
      .insert(goals)
      .values([
        { userId: user.id, title: "Acordar cedo", desiredWeeklyFrequency: 5 },
        { userId: user.id, title: "Me exercitar", desiredWeeklyFrequency: 3 },
        { userId: user.id, title: "Meditar", desiredWeeklyFrequency: 1 },
        { userId: user.id, title: "Não usar celular à noite", desiredWeeklyFrequency: 2 },
      ])
      .returning();

    const today = dayjs().tz('America/Sao_Paulo').startOf('day');
    const startOfWeek = today.startOf('week').add(1, 'day');

    await db.insert(goalCompletions).values([
      { goalId: result[0].id, userId: user.id, createdAt: startOfWeek.toDate() },
      { goalId: result[1].id, userId: user.id, createdAt: startOfWeek.add(1, "day").toDate() },
      { goalId: result[3].id, userId: user.id, createdAt: startOfWeek.add(2, "day").toDate() },
    ]);
  } else {
    console.log('Usuário já existe, não foi necessário executar o seed.');
  }
}

// Função para criar tabelas e executar o seed
export async function createTablesAndSeed(client: PoolClient) {
  try {
    await createTables(client); // Cria as tabelas se não existirem
    await seed(); // Popula o banco de dados com os dados iniciais
  } catch (error) {
    console.error("Erro ao criar tabelas ou executar seed:", error);
  }
}
