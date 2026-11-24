// Telas sem comportamento próprio (escolha de cadastro, termos, privacidade, cookies, 404...).
import { iniciarPagina } from "../interface.js";

iniciarPagina({ exigir: document.body.dataset.exigir ?? null });
