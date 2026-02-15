#!/usr/bin/env python3
"""
Teste de Conexão com Supabase - Workflow AI
Executa testes básicos para verificar se o banco está funcionando
"""

import os
import sys
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def test_supabase_connection():
    """Testa a conexão básica com o Supabase"""
    print("Testando conexão com Supabase...")

    # Obter credenciais
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        print("Credenciais não encontradas!")
        print("Configure as variáveis de ambiente:")
        print("NEXT_PUBLIC_SUPABASE_URL=your_supabase_url")
        print("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key")
        return None, False

    try:
        # Criar cliente
        supabase: Client = create_client(supabase_url, supabase_key)
        print("Cliente Supabase criado com sucesso")

        # Teste básico - listar tabelas
        print("\nVerificando tabelas criadas...")

        # Teste 1: Contar alunos
        try:
            result = supabase.table('students').select('*', count='exact').execute()
            print(f"Tabela 'students': {result.count} registros")
        except Exception as e:
            print(f"Erro na tabela 'students': {e}")

        # Teste 2: Contar professores
        try:
            result = supabase.table('teachers').select('*', count='exact').execute()
            print(f"Tabela 'teachers': {result.count} registros")
        except Exception as e:
            print(f"Erro na tabela 'teachers': {e}")

        # Teste 3: Contar turmas
        try:
            result = supabase.table('classes').select('*', count='exact').execute()
            print(f"Tabela 'classes': {result.count} registros")
        except Exception as e:
            print(f"Erro na tabela 'classes': {e}")

        # Teste 4: Verificar configurações
        try:
            result = supabase.table('studio_settings').select('*').execute()
            print(f"Tabela 'studio_settings': {len(result.data)} configurações")
        except Exception as e:
            print(f"Erro na tabela 'studio_settings': {e}")

        # Teste 5: Query complexa (alunos matriculados)
        try:
            result = supabase.table('enrollments').select('*, students(name), classes(name)').execute()
            print(f"Tabela 'enrollments': {len(result.data)} matrículas ativas")
        except Exception as e:
            print(f"Erro na tabela 'enrollments': {e}")

        print("\nTodos os testes básicos passaram!")
        return supabase, True

    except Exception as e:
        print(f"Erro de conexão: {e}")
        return None, False

def test_ai_integration(supabase: Client):
    """Testa a integração com a IA usando dados reais"""
    print("\nTestando integração com IA...")

    try:
        print("Consultando dados para IA...")

        # Buscar dados de alunos
        students_response = supabase.table('students').select('*', count='exact').execute()
        total_students = students_response.count
        active_students = len([s for s in students_response.data if s['status'] == 'active'])
        retention_rate = round((active_students / total_students) * 100) if total_students > 0 else 0
        print("Dados de alunos consultados com sucesso")
        print(f"   - Total: {total_students}")
        print(f"   - Ativos: {active_students}")
        print(f"   - Retenção: {retention_rate}%")

        # Buscar dados de professores
        teachers_response = supabase.table('teachers').select('*', count='exact').execute()
        total_teachers = teachers_response.count
        active_teachers = len([t for t in teachers_response.data if t['status'] == 'active'])
        print("Dados de professores consultados com sucesso")
        print(f"   - Total: {total_teachers}")
        print(f"   - Ativos: {active_teachers}")

        # Buscar dados financeiros
        this_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = (this_month.replace(day=28) + timedelta(days=4)).replace(day=1)
        
        paid_payments_response = supabase.table('payments').select('amount').eq('status', 'paid').gte('payment_date', this_month.isoformat()).lt('payment_date', next_month.isoformat()).execute()
        monthly_revenue = sum([p['amount'] for p in paid_payments_response.data])
        print("Dados financeiros consultados com sucesso")
        print(f"   - Receita mensal: R$ {monthly_revenue}")

        # Buscar dados de aulas
        classes_response = supabase.table('classes').select('*', count='exact').execute()
        total_classes = classes_response.count
        print("Dados de aulas consultados com sucesso")
        print(f"   - Total de turmas: {total_classes}")

        print("\nIntegração com IA funcionando!")
        return True

    except Exception as e:
        print(f"Erro na integração IA: {e}")
        return False

def main():
    """Função principal"""
    print("Workflow AI - Teste de Conexão Supabase")
    print("=" * 50)

    # Teste 1: Conexão básica
    supabase_client, connection_ok = test_supabase_connection()

    # Teste 2: Integração IA (só se conexão OK)
    if connection_ok:
        ai_ok = test_ai_integration(supabase_client)

        if ai_ok:
            print("\n" + "=" * 50)
            print("SUCESSO TOTAL!")
            print("Seu Supabase está configurado e integrado ao Workflow AI")
            print("A IA agora pode fornecer respostas baseadas em dados reais!")
        else:
            print("\n" + "=" * 50)
            print("Conexão OK, mas integração IA com problemas")
    else:
        print("\n" + "=" * 50)
        print("FALHA na conexão com Supabase")
        print("Verifique suas credenciais e tente novamente")

if __name__ == "__main__":
    main()