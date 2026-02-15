import { nicheDictionary, NicheType } from '@/config/niche-dictionary';

// Definição de Schemas de Metadados por Nicho
export const NicheSchemas = {
  gym: {
    student: {
      height: { type: 'number', label: 'Altura (cm)' },
      weight: { type: 'number', label: 'Peso (kg)' },
      goals: { type: 'multiselect', label: 'Objetivos', options: ['Hipertrofia', 'Emagrecimento', 'Resistência'] }
    },
    teacher: {
      cref: { type: 'string', label: 'Registro CREF', required: true }
    }
  },
  dentist: {
    student: {
      anamnesis: { type: 'textarea', label: 'Anamnese Inicial' },
      last_visit: { type: 'date', label: 'Última Visita' }
    },
    teacher: {
      cro: { type: 'string', label: 'Registro CRO', required: true },
      specialty: { type: 'text', label: 'Especialidade' }
    }
  },
  dance: {
    student: {
      level: { type: 'select', label: 'Nível', options: ['Iniciante', 'Intermediário', 'Avançado'] },
      shoes_size: { type: 'number', label: 'Tamanho Sapatilha' }
    },
    teacher: {
      styles: { type: 'tags', label: 'Estilos que ensina' }
    }
  },
  // Adicionar schemas padrões para os novos nichos
  default: {
    student: {
      notes: { type: 'textarea', label: 'Observações' }
    },
    teacher: {
      bio: { type: 'textarea', label: 'Biografia' }
    }
  }
};

export class NicheService {
  /**
   * Retorna os campos personalizados necessários para um cadastro nesse nicho
   */
  static getCustomFields(niche: string, entity: 'student' | 'teacher') {
    // @ts-ignore
    const schema = NicheSchemas[niche]?.[entity] || NicheSchemas.default[entity];
    return schema;
  }

  /**
   * Traduz um termo genérico para o termo do nicho
   */
  static translate(niche: string, term: 'client' | 'provider' | 'service' | 'establishment') {
    // @ts-ignore
    return nicheDictionary.pt[niche]?.[term] || nicheDictionary.pt.dance[term];
  }

  /**
   * Valida se os metadados estão corretos para o nicho
   */
  static validateMetadata(niche: string, entity: 'student' | 'teacher', metadata: any) {
    const fields = this.getCustomFields(niche, entity);
    const errors = [];

    for (const [key, config] of Object.entries(fields)) {
      // @ts-ignore
      if (config.required && !metadata[key]) {
        // @ts-ignore
        errors.push(`O campo ${config.label} é obrigatório.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
