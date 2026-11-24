

import { iniciarPagina } from "../interface.js";
import { aplicarMascara, formatarCnpj } from "../mascaras.js";

const { continuar } = iniciarPagina({ exigir: "visitante" });
if (continuar) {
  aplicarMascara(document.getElementById("campoCnpj"), formatarCnpj);
  document.getElementById("formularioCadastroOrganizador").addEventListener("submit", (e) => e.preventDefault());
}
