import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../env";
import { createTablesAndSeed } from "./seed";

// Inicializa o cliente PostgreSQL com pool de conexões
export const client = postgres(env.DATABASE_URL, {
  max: 10,                // Limita o número máximo de conexões simultâneas
  idle_timeout: 30,       // Tempo de inatividade antes de encerrar uma conexão
  connect_timeout: 30,    // Tempo de conexão máximo
  keep_alive: true,       // Mantém a conexão ativa
});

// Testa a conexão com o banco de dados
client`SELECT 1`.then(() => {
  console.log('Conexão com o banco de dados estabelecida com sucesso!');
}).catch((err) => {
  console.error('Erro ao conectar no banco de dados:', err);
});

// Inicializa o Drizzle ORM
export const db = drizzle(client, { schema, logger: false });

async function initializeDatabase() {
  try {
    console.log("Criando tabelas e executando seeds...");
    await createTablesAndSeed(client); // Executa a criação das tabelas e seed
    console.log("Tabelas criadas e seeds executados com sucesso.");
  } catch (error) {
    console.error("Erro ao criar tabelas ou executar seeds:", error);
  }
}

// Inicializa o banco de dados quando o aplicativo começa
initializeDatabase();