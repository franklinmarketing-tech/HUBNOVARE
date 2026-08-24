"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Tag } from "lucide-react";
import { validarCupom } from "@/lib/cupons";
import { salvarLead } from "@/lib/leads";
import { falarNoWhatsApp } from "@/lib/contato";
import { CamposLead, leadCompleto, type DadosLead } from "@/components/CamposLead";

/**
 * Cupom como ISCA de captação (Briefing slide 13). Enquanto o checkout não
 * existe, o cupom válido pede o e-mail para "reservar o desconto" — e isso
 * vira lead com o código usado, pronto pro comercial converter. Quando o
 * gateway entrar, o mesmo cupom passa a aplicar o desconto no pagamento.
 */
export function FormularioCupom() {
  const [codigo, setCodigo] = useState("");
  const [cupom, setCupom] = useState<{ codigo: string; desconto: number; descricao: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const [reservado, setReservado] = useState(false);

  const validar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    const res = validarCupom(codigo);
    if (res.valido && res.cupom) {
      setCupom({ codigo: res.cupom.codigo, desconto: res.cupom.descontoPercentual, descricao: res.cupom.descricao });
      setErro(null);
    } else {
      setCupom(null);
      setErro(res.mensagem);
    }
  };

  const ok = leadCompleto(dados);

  const reservar = () => {
    if (!ok || !cupom) return;
    setReservado(true);
    salvarLead({
      email: dados.email,
      nome: dados.nome.trim(),
      telefone: dados.telefone,
      tipo: "cupom",
      origem: `cupom:${cupom.codigo}`,
      payload: { cupom: cupom.codigo, desconto: cupom.desconto },
    });
    window.open(
      falarNoWhatsApp(
        `Olá! Aqui é ${dados.nome.trim()}.\n` +
          `Quero garantir o cupom ${cupom.codigo} (${cupom.desconto}% OFF) no Workspace Novare.\n` +
          `WhatsApp: ${dados.telefone}\nE-mail: ${dados.email}`,
      ),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-slate-900">Possui um cupom de parceria ou promoção?</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Valide seu código e reserve a condição exclusiva nos produtos Novare.
      </p>

      {!cupom ? (
        <>
          <form onSubmit={validar} className="mt-3 flex gap-2">
            <input
              type="text"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value.toUpperCase());
                if (erro) setErro(null);
              }}
              placeholder="Digite seu código"
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-800 focus:border-primary focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-soft"
            >
              Validar
              <ArrowRight className="h-3 w-3" />
            </button>
          </form>

          {erro && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span className="font-medium">{erro}</span>
            </div>
          )}
        </>
      ) : reservado ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-medium">
            Desconto de {cupom.desconto}% reservado! Um consultor da Novare vai finalizar com você — abrimos o WhatsApp.
          </span>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            Cupom válido — {cupom.desconto}% OFF
          </div>
          <p className="mt-0.5 text-xs text-emerald-800/80">{cupom.descricao}</p>

          <div className="mt-3">
            <CamposLead dados={dados} aoMudar={setDados} />
          </div>

          <button
            onClick={reservar}
            disabled={!ok}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Reservar meu desconto
            <ArrowRight className="h-3 w-3" />
          </button>
          <p className="mt-2 flex items-center gap-1 text-[10px] text-emerald-700/70">
            <Lock className="h-3 w-3" /> Seus dados são tratados conforme a LGPD.
          </p>
        </div>
      )}
    </div>
  );
}
