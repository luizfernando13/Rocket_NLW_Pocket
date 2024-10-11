import { db } from "./index"; // Importa o db já inicializado
import { goalCompletions, goals } from "./schema"; // Esquemas das tabelas
import dayjs from "dayjs"; // Biblioteca para manipulação de datas
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Função para criar as tabelas se não existirem
async function createTables(client: any) {
  // Cria a tabela goals
  await client`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      desired_weekly_frequency INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Cria a tabela goal_completions
  await client`
    CREATE TABLE IF NOT EXISTS goal_completions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

// Função que insere dados nas tabelas
export async function seed() {
  // Exclui todas as entradas existentes
  await db.delete(goalCompletions);
  await db.delete(goals);

  // Insere novos registros
  const result = await db
    .insert(goals)
    .values([
      { title: "Acordar cedo", desiredWeeklyFrequency: 5 },
      { title: "Me exercitar", desiredWeeklyFrequency: 3 },
      { title: "Meditar", desiredWeeklyFrequency: 1 },
      { title: "Não usar celular a noite", desiredWeeklyFrequency: 2 },
    ])
    .returning();

  const today = dayjs().tz('America/Sao_Paulo').startOf('day');
  const startOfWeek = today.startOf('week').add(1, 'day');

  await db.insert(goalCompletions).values([
    { goalId: result[0].id, createdAt: startOfWeek.toDate() },
    { goalId: result[1].id, createdAt: startOfWeek.add(1, "day").toDate() },
    { goalId: result[3].id, createdAt: startOfWeek.add(2, "day").toDate() },
  ]);
}

// Função para criar tabelas e executar o seed
export async function createTablesAndSeed(client: any) {
  try {
    await createTables(client); // Cria as tabelas se elas não existirem
    await seed(); // Popula o banco de dados com os dados iniciais
  } catch (error) {
    console.error("Erro ao criar tabelas ou executar seed:", error);
  }
}