import { useEffect, useMemo, useState } from "react";
import css from "./GoalModal.module.css";

/* ===== mensagens ===== */
const MONTH_HINTS = {
  1: "Jogar no básico é sempre mais seguro — e assim se vai longe.",
  2: "Dois já dão ritmo. Bora!",
  3: "Trinca certeira! Foco que dá!",
  4: "Quatro pede constância, mas tá tranquilo.",
  5: "Boa média! Precisa de determinação… vamos nessa!",
  6: "Seis é maratona leve, dá pra manter.",
  7: "Sete: já exige disciplina de verdade.",
  8: "Oito livros? Tá buscando nível avançado!",
  9: "Nove: agora é jogo de elite.",
  10: "This is what I'm talking about!!! Vamos com TUDOO!!",
};

// tabela “marcos” do ano (usa a mais próxima ≤ valor)
const YEAR_HINTS = {
  1: "Uma leitura por ano: devagar e sempre.",
  5: "Cinco livros no ano é um belo hábito!",
  10: "Dez no ano: rotina de leitor raiz!",
  11: "Onze livros! A engrenagem tá rodando.",
  12: "Doze: um por mês! Ritmo perfeito.",
  13: "Treze leituras, já virou superstição boa.",
  14: "Quatorze: quase quinze, bora seguir firme!",
  15: "Quinze livros! Você tá numa maratona.",
  16: "Dezesseis: disciplina e constância.",
  17: "Dezessete leituras, já parece profissional.",
  18: "Dezoito livros: dá pra sentir evolução!",
  19: "Dezenove! Chegando nos vinte!",
  20: "Vinte? Tá virando lenda!",
  21: "Vinte e um: é vitória atrás de vitória.",
  22: "Vinte e dois: leitor imbatível.",
  23: "Vinte e três livros, disciplina exemplar.",
  24: "Vinte e quatro: dois por mês!",
  25: "Vinte e cinco livros, metade de cinquenta!",
  26: "Vinte e seis: nível intermediário de maratonista.",
  27: "Vinte e sete leituras: foco absurdo.",
  28: "Vinte e oito: tá quase em trinta!",
  29: "Vinte e nove: mais um e fecha trintão!",
  30: "Trinta livros: disciplina de monge.",
  31: "Trinta e um: começa a segunda metade do ano forte.",
  32: "Trinta e dois: leitura sem parar!",
  33: "Trinta e três: número místico, leitor lendário.",
  34: "Trinta e quatro: já não tem volta!",
  35: "Trinta e cinco livros: potência literária.",
  36: "Trinta e seis: constância absurda.",
  37: "Trinta e sete leituras, visão de águia.",
  38: "Trinta e oito: leitor de elite.",
  39: "Trinta e nove, só falta um pro quarentão!",
  40: "Quarenta é missão de maratonista literário.",
  41: "Quarenta e um: começou a escalada final.",
  42: "Quarenta e dois: leitor sideral!",
  43: "Quarenta e três leituras, quase cinquenta.",
  44: "Quarenta e quatro: ritmo avassalador.",
  45: "Quarenta e cinco livros! Que disciplina!",
  46: "Quarenta e seis leituras firmes.",
  47: "Quarenta e sete: tá voando!",
  48: "Quarenta e oito: duas dúzias x2!",
  49: "Quarenta e nove, falta só um pro cinquentão.",
  50: "Cinquenta no ano? Profissional da leitura!",
  51: "Cinquenta e um: ultrapassando limites.",
  52: "Cinquenta e dois: um por semana!",
  53: "Cinquenta e três: resistência literária.",
  54: "Cinquenta e quatro leituras: disciplina de atleta.",
  55: "Cinquenta e cinco: quase sessentinha!",
  56: "Cinquenta e seis: nível sobre-humano.",
  57: "Cinquenta e sete livros: respeita!",
  58: "Cinquenta e oito: foco absoluto.",
  59: "Cinquenta e nove: rumo aos sessenta.",
  60: "Sessenta leituras! Pódio garantido.",
  61: "Sessenta e um: começou a jornada final.",
  62: "Sessenta e dois: imparável.",
  63: "Sessenta e três: firme, constante.",
  64: "Sessenta e quatro: oito por oito!",
  65: "Sessenta e cinco livros: quase setenta!",
  66: "Sessenta e seis: nível lendário.",
  67: "Sessenta e sete leituras, você é exemplo.",
  68: "Sessenta e oito: ultrapassando barreiras.",
  69: "Sessenta e nove, falta um pro setentão!",
  70: "Setenta livros: resistência absurda.",
  71: "Setenta e um: maratona infinita.",
  72: "Setenta e dois: seis por mês!",
  73: "Setenta e três leituras: respeito máximo.",
  74: "Setenta e quatro: imparável.",
  75: "Setenta e cinco: três quartos do caminho!",
  76: "Setenta e seis: disciplina insana.",
  77: "Setenta e sete: número mágico, leitor supremo.",
  78: "Setenta e oito livros: grandeza literária.",
  79: "Setenta e nove: já bateu recordes.",
  80: "Oitenta leituras: atleta literário.",
  81: "Oitenta e um: resistência pura.",
  82: "Oitenta e dois: recorde atrás de recorde.",
  83: "Oitenta e três: maratonista profissional.",
  84: "Oitenta e quatro leituras, constância exemplar.",
  85: "Oitenta e cinco: só quinze pro cem!",
  86: "Oitenta e seis: quase lá.",
  87: "Oitenta e sete: foco total.",
  88: "Oitenta e oito: dois infinitos literários.",
  89: "Oitenta e nove: falta um pro noventão!",
  90: "Noventa leituras: mestre da leitura.",
  91: "Noventa e um: reta final.",
  92: "Noventa e dois: o impossível virou rotina.",
  93: "Noventa e três: disciplina inabalável.",
  94: "Noventa e quatro: imparável!",
  95: "Noventa e cinco: só cinco pro cem!",
  96: "Noventa e seis leituras: meta lendária.",
  97: "Noventa e sete livros: orgulho puro.",
  98: "Noventa e oito: tá batendo no limite!",
  99: "Noventa e nove: só falta UM!",
  100: "CEM livros no ano! Você é MITO da leitura!",
};

function pickHint(scope, val){
  const table = scope === "month" ? MONTH_HINTS : YEAR_HINTS;
  const keys = Object.keys(table).map(Number).sort((a,b)=>a-b);
  let chosenKey = null;
  for (const k of keys){ if (val >= k) chosenKey = k; else break; }
  if (chosenKey != null) return table[chosenKey];
  return scope === "month"
    ? "Escolha uma meta leve pra começar."
    : "Escolha uma meta que caiba no seu ano.";
}

export default function GoalModal({
  open,
  title = "Meta",
  initial = 0,
  scope = "month",          // "month" | "year" (define as mensagens)
  onSave,
  onClose,
  inputWidth,               // opcional (px, rem etc). Ex.: "110px"
  cardWidth, 
}) {
  const [v, setV] = useState(initial || 0);
  useEffect(()=>{ if (open) setV(initial || 0); }, [open, initial]);

  const hint = useMemo(()=> pickHint(scope, Number(v) || 0), [scope, v]);

  if (!open) return null;

  const inc = (d)=> setV(n => Math.max(0, (Number(n)||0)+d));
  const submit = (e) => {
    e?.preventDefault?.();
    onSave?.(v);
    onClose?.();
  };

  const styleVars = {
        ...(inputWidth ? {"--gm-input-w": inputWidth} : {}),
        ...(cardWidth  ? {"--gm-card-w":  cardWidth } : {}),
      };

  return (
    <div className={css.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={css.card} onClick={(e)=>e.stopPropagation()} style={styleVars}>
        <h3 className={css.title}>{title}</h3>

        <form className={css.form} onSubmit={submit}>
          <div className={css.controls}>
            <button type="button" className={css.step} onClick={()=>inc(-1)}>-</button>

            <input
              className={css.input}
              type="number"
              inputMode="numeric"
              min="0"
              value={v}
              onChange={(e)=> setV(Math.max(0, Number(e.target.value)||0))}
              onKeyDown={(e)=>{ if (e.key === "Enter") submit(e); }}
            />

            <button type="button" className={css.step} onClick={()=>inc(+1)}>+</button>
          </div>

          <p className={css.hint}><em>{hint}</em></p>

          <div className={css.actions}>
            <button type="button" className={css.cancel} onClick={onClose}>Cancelar</button>
            <button type="submit" className={css.save}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
