"use client"

import { Check, X } from "lucide-react"
import { checkPasswordStrength, PasswordStrength } from "@/lib/password-utils"
import { cn } from "@/lib/utils"

interface PasswordStrengthMeterProps {
  password: string
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = checkPasswordStrength(password);

  const RequirementItem = ({ met, label }: { met: boolean, label: string }) => (
    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
      {met ? (
        <Check className="w-3 h-3 text-emerald-500" />
      ) : (
        <X className="w-3 h-3 text-slate-300 dark:text-slate-600" />
      )}
      <span className={cn(
        "transition-colors",
        met ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400"
      )}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
      {/* Barra de Progresso */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Força da Senha</span>
          <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white", strength.color)}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          {[0, 1, 2, 3].map((step) => (
            <div 
              key={step}
              className={cn(
                "flex-1 transition-all duration-500",
                strength.score > step ? strength.color : "bg-transparent"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requisitos */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <RequirementItem met={strength.requirements.length} label="Mínimo 8 caracteres" />
        <RequirementItem met={strength.requirements.upper} label="Letra maiúscula" />
        <RequirementItem met={strength.requirements.lower} label="Letra minúscula" />
        <RequirementItem met={strength.requirements.number} label="Um número" />
        <RequirementItem met={strength.requirements.special} label="Caractere especial" />
      </div>
    </div>
  );
}
