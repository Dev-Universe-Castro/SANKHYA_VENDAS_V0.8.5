import { NextResponse } from 'next/server';
import { redisCacheService } from '@/lib/redis-cache-service';

const API_LOGS_KEY = 'global:server:api_logs:sankhya';
const MAX_LOGS = 500; // Histórico de 500 logs globais (persistidos por 7 dias)

export async function addApiLog(log: {
  method: string;
  url: string;
  status: number;
  duration: number;
  tokenUsed: boolean;
  error?: string;
}) {
  const newLog = {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    ...log,
    error: log.error || null
  };

  try {
    // Buscar logs existentes do Redis (CACHE GLOBAL DO SERVIDOR)
    const existingLogs = await redisCacheService.get<any[]>(API_LOGS_KEY) || [];

    // Adicionar novo log no início
    existingLogs.unshift(newLog);

    // Manter apenas os últimos 100 logs
    const updatedLogs = existingLogs.slice(0, MAX_LOGS);

    // Salvar de volta no Redis - logs persistentes por 7 dias
    await redisCacheService.set(API_LOGS_KEY, updatedLogs, 7 * 24 * 60 * 60 * 1000); // 7 dias

    const statusEmoji = log.status >= 400 ? '❌' : '✅';
    const errorInfo = log.error ? ` | Erro: ${log.error}` : '';
    console.log(`${statusEmoji} [GLOBAL SERVER LOG] ${log.method} ${log.url} - ${log.status}${errorInfo}`);
  } catch (error) {
    console.error('❌ Erro ao adicionar log global do servidor:', error);
  }
}

export async function GET() {
  try {
    console.log('📋 [GLOBAL] Buscando logs globais do servidor...');

    // Buscar logs do Redis (CACHE GLOBAL COMPARTILHADO DO SERVIDOR)
    const apiLogs = await redisCacheService.get<any[]>(API_LOGS_KEY) || [];

    console.log(`✅ [API /admin/api-logs] ${apiLogs.length} logs globais do servidor encontrados (persistidos por 7 dias)`);

    return NextResponse.json({
      logs: apiLogs,
      total: apiLogs.length,
      maxLogs: MAX_LOGS,
      isGlobal: true,
      persistenceDays: 7,
      message: `Logs globais do servidor - histórico de ${apiLogs.length}/${MAX_LOGS} logs (7 dias de persistência)`
    });
  } catch (error) {
    console.error('❌ [API /admin/api-logs] Erro ao obter logs globais:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';