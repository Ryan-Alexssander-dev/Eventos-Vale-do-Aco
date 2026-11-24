// Formatação de datas e valores. Datas "AAAA-MM-DD" são lidas SEM fuso horário
// (new Date("2026-11-28") viraria 27/11 no Brasil).

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MESES_ABREVIADOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function dataLocal(iso) {
  const [ano, mes, dia] = String(iso).split("-").map(Number);
  return new Date(ano, (mes || 1) - 1, dia || 1);
}

export function hoje() {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  return data;
}

export function dataEmIso(data) {
  const p = (n) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

export function eventoJaAconteceu(evento) {
  return dataLocal(evento.data) < hoje();
}

export function formatarData(iso) {
  const d = dataLocal(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatarDataHora(evento) {
  return evento.hora ? `${formatarData(evento.data)} • ${evento.hora}` : formatarData(evento.data);
}

export function formatarPreco(preco) {
  return preco > 0 ? preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Gratuito";
}

export function partesDaData(iso) {
  const d = dataLocal(iso);
  return { dia: String(d.getDate()).padStart(2, "0"), mes: MESES_ABREVIADOS[d.getMonth()], semana: DIAS_SEMANA[d.getDay()] };
}

export function rotuloMes(iso) {
  const d = dataLocal(iso);
  const nome = MESES[d.getMonth()];
  return `${nome[0].toUpperCase()}${nome.slice(1)} de ${d.getFullYear()}`;
}

export function pluralizar(quantidade, singular, plural) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

export function primeiroNome(nome) {
  return String(nome ?? "").trim().split(/\s+/)[0] ?? "";
}

export function mascararEmail(email) {
  const [usuario = "", dominio = ""] = String(email).split("@");
  return `${usuario.slice(0, 2)}${"*".repeat(Math.max(usuario.length - 2, 1))}@${dominio}`;
}
