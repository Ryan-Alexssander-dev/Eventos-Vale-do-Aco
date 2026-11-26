const { randomUUID } = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");
const config = require("../config");

const EXTENSOES_POR_TIPO = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let cliente;

function obterCliente() {
  const { url, serviceRoleKey, bucket } = config.supabase;
  if (!url || !serviceRoleKey || !bucket) {
    const error = new Error("O armazenamento de capas não está configurado.");
    error.status = 503;
    throw error;
  }
  if (!cliente) {
    cliente = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return { cliente, bucket };
}

async function subirCapa(arquivo, tipo) {
  const extensao = EXTENSOES_POR_TIPO[tipo];
  if (!extensao) {
    const error = new Error("O formato da imagem de capa não é aceito.");
    error.status = 400;
    throw error;
  }

  const { cliente: supabase, bucket } = obterCliente();
  const caminho = `eventos/${randomUUID()}.${extensao}`;
  const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo.buffer, {
    contentType: tipo,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    const falha = new Error("Não foi possível enviar a imagem de capa ao armazenamento.", { cause: error });
    falha.status = 502;
    throw falha;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(caminho);
  if (!data?.publicUrl) {
    const falha = new Error("Não foi possível obter a URL pública da imagem de capa.");
    falha.status = 502;
    throw falha;
  }
  return data.publicUrl;
}

async function removerCapa(url) {
  if (typeof url !== "string" || !url) {
    return false;
  }

  const { cliente: supabase, bucket } = obterCliente();
  const baseUrl = new URL(config.supabase.url);
  let imagemUrl;
  try {
    imagemUrl = new URL(url);
  } catch {
    return false;
  }
  const prefixo = `/storage/v1/object/public/${bucket}/`;
  if (imagemUrl.origin !== baseUrl.origin || !imagemUrl.pathname.startsWith(prefixo)) {
    return false;
  }

  const caminho = imagemUrl.pathname.slice(prefixo.length);
  if (!caminho) {
    return false;
  }
  const { error } = await supabase.storage.from(bucket).remove([caminho]);
  if (error) {
    const falha = new Error("Não foi possível remover a imagem de capa antiga do armazenamento.");
    falha.status = 502;
    throw falha;
  }
  return true;
}

module.exports = { subirCapa, removerCapa };
