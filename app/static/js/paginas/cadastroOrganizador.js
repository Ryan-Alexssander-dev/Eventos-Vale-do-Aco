

import { iniciarPagina } from "../interface.js";
import { aplicarMascara, formatarCnpj, formatarTelefone } from "../mascaras.js";

const { continuar } = iniciarPagina({ exigir: "visitante" });
if (continuar) {
  aplicarMascara(document.getElementById("campoCnpj"), formatarCnpj);
  aplicarMascara(document.getElementById("campoTelefone"), formatarTelefone);
  aplicarMascara(document.getElementById("campoTelefoneEmpresa"), formatarTelefone);
  document.getElementById("formularioCadastroOrganizador").addEventListener("submit", (e) => e.preventDefault());
}
