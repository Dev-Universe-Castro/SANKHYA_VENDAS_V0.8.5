import { NextResponse } from 'next/server';
import { obterTokenAtual } from '@/lib/sankhya-api';

export async function GET() {
  try {
    console.log('📋 [API /admin/token-info] Buscando informações do token...');

    const tokenStatus = await obterTokenAtual();

    if (!tokenStatus) {
      console.log('⚠️ [API /admin/token-info] Nenhum token encontrado');
      return NextResponse.json({
        token: null,
        ativo: false,
        mensagem: 'Nenhum token disponível. O token será gerado na próxima requisição.'
      });
    }

    const response = {
      token: tokenStatus.token,
      createdAt: tokenStatus.geradoEm,
      expiresIn: Math.floor(tokenStatus.tempoRestanteMs / 1000), // Converter para segundos
      remainingTime: Math.floor(tokenStatus.tempoRestanteMs / 1000), // Tempo restante em segundos
      ativo: tokenStatus.ativo
    };

    console.log('✅ [API /admin/token-info] Token encontrado:', {
      ativo: response.ativo,
      remainingTime: response.remainingTime,
      createdAt: tokenStatus.geradoEm
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [API /admin/token-info] Erro ao obter informações do token:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao obter informações do token',
        token: null,
        ativo: false
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';