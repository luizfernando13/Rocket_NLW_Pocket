import { db } from "./index";
import { goalCompletions, goals, users } from "./schema";
import dayjs from "../dayjsConfig"; // Importa o dayjs configurado
import { eq, and, gte, lte, inArray, or } from 'drizzle-orm';
import type { PoolClient } from 'pg';

// Função para criar as tabelas se elas não existirem
async function createTables(client: PoolClient) {
  await client`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await client`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL,
      desired_weekly_frequency INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

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
  const today = dayjs().tz('America/Sao_Paulo').startOf('day');
  const startOfWeek = today.startOf('isoWeek'); // Começa na segunda-feira
  const endOfWeek = today.endOf('isoWeek');

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, 'user@example.com'))
    .limit(1);

  if (!existingUser.length) {
    const [user] = await db
      .insert(users)
      .values({
        email: 'user@example.com',
        passwordHash: 'hashedpassword',
      })
      .returning();

    const result = await db
      .insert(goals)
      .values([
        { userId: user.id, title: "Acordar cedo", desiredWeeklyFrequency: 5 },
        { userId: user.id, title: "Me exercitar", desiredWeeklyFrequency: 3 },
        { userId: user.id, title: "Meditar", desiredWeeklyFrequency: 1 },
        { userId: user.id, title: "Não usar celular à noite", desiredWeeklyFrequency: 2 },
      ])
      .returning();

    await db.insert(goalCompletions).values([
      { goalId: result[0].id, userId: user.id, createdAt: startOfWeek.toDate() },
      { goalId: result[1].id, userId: user.id, createdAt: startOfWeek.add(1, "day").toDate() },
      { goalId: result[3].id, userId: user.id, createdAt: startOfWeek.add(2, "day").toDate() },
    ]);
  }

  // Remover conclusões de metas fora da semana atual
  console.log('Verificando conclusões de metas antigas para todos os usuários.');

  // Verifica metas completadas fora da semana atual
  const completionsToRemove = await db
    .select({
      completionId: goalCompletions.id,
      completionDate: goalCompletions.createdAt
    })
    .from(goalCompletions)
    .innerJoin(goals, eq(goalCompletions.goalId, goals.id))
    .where(
      or(
        lte(goalCompletions.createdAt, startOfWeek.toDate()), // Conclusões antes do início da semana
        gte(goalCompletions.createdAt, endOfWeek.toDate()) // Conclusões após o fim da semana
      )
    );

  // Print para depuração
  for (const completion of completionsToRemove) {
    console.log(`Conclusão de meta encontrada para remoção: ID = ${completion.completionId}, Data de Conclusão = ${completion.completionDate}`);
  }

  if (completionsToRemove.length > 0) {
    const completionIds = completionsToRemove.map(c => c.completionId);

    // Remove conclusões de metas
    await db.delete(goalCompletions).where(inArray(goalCompletions.id, completionIds));

    console.log(`Conclusões de metas removidas: ${completionIds.join(', ')}`);
  } else {
    console.log('Nenhuma conclusão de meta encontrada para remoção.');
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
