/**
 * Projeto Evolução — amigos + guildas usando Firestore (sem backend adicional).
 * Somente nickname (não e-mail/foto) é compartilhado entre jogadores autenticados.
 * As regras em firestore.rules são OBRIGATÓRIAS para impedir convites falsificados.
 */
import { getApp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import {
  getFirestore, doc, collection, getDoc, getDocs, setDoc, addDoc,
  deleteDoc, updateDoc, onSnapshot, query, where, arrayUnion, arrayRemove
} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';

const el = (id) => document.getElementById(id);
let banco, usuario, obterNickname, ultimaPublicacao = null, timerPerfil = null;
let amizades = [], pedidos = [], convitesGuilda = [], guildas = [];
let disposers = [];
const PERFIS = new Map();

function feedback(msg, error = false) {
  const alvo = el('socialFeedback');
  if (!alvo) return;
  alvo.textContent = msg;
  alvo.dataset.error = String(error);
}
function mensagemErro(err) {
  if (err?.code === 'permission-denied') return 'Permissão negada. Publique o novo arquivo firestore.rules junto ao Hosting.';
  if (err?.code === 'unavailable') return 'O banco de dados está indisponível. Verifique sua conexão.';
  if (err?.code === 'already-exists') return 'Esse convite ou amizade já existe.';
  return err?.message ? String(err.message).slice(0,220) : 'Não foi possível concluir esta operação.';
}
async function acao(fn, btn) {
  if (btn) btn.disabled = true;
  try { await fn(); }
  catch (err) { console.error('[Projeto Evolução Social]', err); feedback(mensagemErro(err), true); }
  finally { if (btn) btn.disabled = false; }
}
function codec(uid) { return `EVO-${uid}`; }
function uidDoCodigo(codigo) {
  const texto = codigo.trim();
  if (!texto.toUpperCase().startsWith('EVO-')) return null;
  const id = texto.slice(4); // Não alterar maiúsculas/minúsculas do UID do Firebase.
  return /^[a-zA-Z0-9_-]{10,128}$/.test(id) ? id : null;
}
function par(a,b) { return [a,b].sort().join('_'); }
function perfilRef(uid) { return doc(banco, 'publicProfiles', uid); }
function amizadeRef(a,b) { return doc(banco,'friendships',par(a,b)); }
function pedidoRef(destino, remetente) { return doc(banco,'friendRequests',destino,'incoming',remetente); }
function conviteRef(destino, guildId) { return doc(banco,'guildInvites',destino,'incoming',guildId); }
function guildaRef(id) { return doc(banco,'guilds',id); }
function texto(node, content) { node.textContent = String(content); return node; }
function bloco(tag, classe, conteudo) {
  const obj = document.createElement(tag);
  if (classe) obj.className = classe;
  if (conteudo != null) obj.textContent = conteudo;
  return obj;
}
function botao(nome, fn, classe = '') {
  const b = bloco('button', classe, nome);
  b.type = 'button';
  b.addEventListener('click', () => acao(() => fn(), b));
  return b;
}
function vazio(target, mensagem) {
  target.replaceChildren(bloco('p','social-muted', mensagem));
}
async function pegarPerfil(uid) {
  if (PERFIS.has(uid)) return PERFIS.get(uid);
  const snap = await getDoc(perfilRef(uid));
  const nome = snap.exists() ? (snap.data().nickname || 'Aventureiro') : 'Aventureiro';
  PERFIS.set(uid, nome);
  return nome;
}
function person(nome) {
  const div = bloco('div','social-person');
  div.append(bloco('span','social-avatar','✦'), bloco('strong','',nome));
  return div;
}
function rowPessoa(nome, acoes) {
  const row = bloco('div','social-item');
  row.append(person(nome));
  const controls=bloco('div','social-actions');
  for (const b of acoes) controls.append(b);
  row.append(controls);
  return row;
}

/** A função não grava XP ou histórico em perfis públicos. */
export function atualizarPerfilSocial(novoNome) {
  if (!usuario || !banco) return;
  const nome = String(novoNome || obterNickname?.() || usuario.displayName || 'Jogador').trim().slice(0,20) || 'Jogador';
  if (nome === ultimaPublicacao) return;
  clearTimeout(timerPerfil);
  timerPerfil = setTimeout(async () => {
    try {
      await setDoc(perfilRef(usuario.uid), {nickname:nome});
      ultimaPublicacao = nome;
      PERFIS.set(usuario.uid,nome);
    } catch (e) { feedback('Falha ao atualizar o nickname público: '+mensagemErro(e),true); }
  }, 650);
}

async function enviarAmizade() {
  const codigo = el('socialCodigoAmigo').value;
  const alvo = uidDoCodigo(codigo);
  if (!alvo) return feedback('Código inválido. Peça o código completo EVO-... ao seu amigo.', true);
  if (alvo === usuario.uid) return feedback('Você não pode adicionar a si mesmo.', true);
  const snap = await getDoc(perfilRef(alvo));
  if (!snap.exists()) return feedback('Não encontramos esse jogador. Peça para ele entrar no site uma vez.',true);
  if (amizades.some(a=>a.members.includes(alvo))) return feedback('Vocês já são amigos!');
  const pedido = pedidoRef(alvo,usuario.uid);
  if ((await getDoc(pedido)).exists()) return feedback('Pedido já enviado. Aguarde seu amigo aceitar.');
  if ((await getDoc(pedidoRef(usuario.uid, alvo))).exists()) return feedback('Esse jogador já te convidou! Aceite em Pedidos recebidos.');
  await setDoc(pedido,{fromUid:usuario.uid,toUid:alvo,createdAt:Date.now()});
  el('socialCodigoAmigo').value='';
  feedback(`Pedido de amizade enviado para ${snap.data().nickname || 'Aventureiro'}!`);
}
async function aceitarAmizade(remetente) {
  const requestDoc = pedidoRef(usuario.uid,remetente);
  const snap = await getDoc(requestDoc);
  if (!snap.exists()) throw new Error('Este pedido não existe mais.');
  const membros=[usuario.uid,remetente].sort();
  // As regras conferem que quem aceita recebeu de fato o pedido de amizade.
  await setDoc(amizadeRef(usuario.uid,remetente), {members:membros,createdAt:Date.now()});
  await deleteDoc(requestDoc);
  feedback('Amizade aceita! Agora vocês podem formar uma guilda.');
}
async function recusarAmizade(remetente) {
  await deleteDoc(pedidoRef(usuario.uid,remetente));
  feedback('Pedido recusado.');
}
async function removerAmizade(amigo) {
  if (!confirm('Remover este jogador da sua lista de amizades?')) return;
  await deleteDoc(amizadeRef(usuario.uid,amigo));
  feedback('Amizade removida.');
}

async function criarGuilda() {
  const nome = el('socialGuildaNome').value.trim();
  const tag = el('socialGuildaTag').value.trim().toUpperCase();
  const descricao = el('socialGuildaDescricao').value.trim();
  if (nome.length<3 || nome.length>36 || !/^[A-Z0-9]{2,6}$/.test(tag) || descricao.length>180) {
    return feedback('Use nome de 3 a 36 caracteres e sigla de 2 a 6 letras ou números.', true);
  }
  await addDoc(collection(banco,'guilds'), {
    name:nome,tag,description:descricao,leaderUid:usuario.uid,
    memberUids:[usuario.uid],createdAt:Date.now()
  });
  el('socialCriarGuilda').reset();
  feedback('Guilda criada! Convide seus amigos na lista de guildas abaixo.');
}
async function convidarAmigo(guildId, destinatario) {
  const guilda = guildas.find(g=>g.id===guildId);
  if (!guilda || guilda.leaderUid !== usuario.uid) return feedback('Somente o líder pode convidar.',true);
  if (!destinatario) return feedback('Escolha um amigo para convidar.',true);
  if (guilda.memberUids.includes(destinatario)) return feedback('Ele já faz parte da guilda.',true);
  await setDoc(conviteRef(destinatario,guildId),{
    guildId,toUid:destinatario,fromUid:usuario.uid,createdAt:Date.now()
  });
  feedback('Convite para a guilda enviado!');
}
async function aceitarGuilda(guildId) {
  const destino = guildaRef(guildId);
  const convite = conviteRef(usuario.uid,guildId);
  const [snapGuild,snapConvite] = await Promise.all([getDoc(destino),getDoc(convite)]);
  if (!snapGuild.exists() || !snapConvite.exists()) {
    if (snapConvite.exists()) await deleteDoc(convite);
    return feedback('Convite expirado ou guilda encerrada.',true);
  }
  if (snapGuild.data().memberUids.length >= 20) return feedback('Esta guilda já está cheia.', true);
  await updateDoc(destino,{memberUids:arrayUnion(usuario.uid)});
  await deleteDoc(convite);
  feedback('Bem-vindo à guilda! 🛡');
}
async function rejeitarGuilda(guildId) {
  await deleteDoc(conviteRef(usuario.uid,guildId));
  feedback('Convite para guilda recusado.');
}
async function sairGuilda(guildId) {
  if (!confirm('Deseja sair desta guilda?')) return;
  await updateDoc(guildaRef(guildId),{memberUids:arrayRemove(usuario.uid)});
  feedback('Você saiu da guilda.');
}
async function encerrarGuilda(guildId) {
  if (!confirm('Excluir esta guilda para todos os integrantes? Esta ação não pode ser desfeita.')) return;
  await deleteDoc(guildaRef(guildId));
  feedback('Guilda encerrada. Convites pendentes serão considerados expirados.');
}

let renderPedidosSeq=0,renderAmigosSeq=0,renderConvitesSeq=0,renderGuildasSeq=0;
async function renderPedidos() {
  const seq=++renderPedidosSeq, area=el('socialPedidos');
  el('socialTotalPedidos').textContent=`(${pedidos.length})`;
  if (!pedidos.length) return vazio(area,'Nenhum pedido de amizade pendente.');
  const rows=await Promise.all(pedidos.map(async item=>rowPessoa(
    await pegarPerfil(item.fromUid).catch(()=> 'Aventureiro'), [
      botao('Aceitar',()=>aceitarAmizade(item.fromUid)),
      botao('Recusar',()=>recusarAmizade(item.fromUid),'social-secondary')
    ])));
  if(seq===renderPedidosSeq) area.replaceChildren(...rows);
}
async function renderAmigos() {
  const seq=++renderAmigosSeq, area=el('socialAmigos');
  el('socialTotalAmigos').textContent=`(${amizades.length})`;
  if (!amizades.length) return vazio(area,'Sua lista de amigos está vazia. Compartilhe seu código!');
  const rows=await Promise.all(amizades.map(async item=> {
    const outro=item.members.find(m=>m!==usuario.uid);
    return rowPessoa(await pegarPerfil(outro).catch(()=> 'Aventureiro'),[
      botao('Remover',()=>removerAmizade(outro),'social-danger')
    ]);
  }));
  if(seq===renderAmigosSeq) area.replaceChildren(...rows);
}
async function renderConvitesGuilda() {
  const seq=++renderConvitesSeq, area=el('socialConvitesGuilda');
  if(!convitesGuilda.length) return vazio(area,'Nenhum convite de guilda no momento.');
  const rows=await Promise.all(convitesGuilda.map(async item=> {
    const snap=await getDoc(guildaRef(item.guildId)).catch(()=>null);
    const guilda=snap?.exists()?snap.data():null;
    return rowPessoa(guilda?`[${guilda.tag}] ${guilda.name}`:'Guilda encerrada',[
      ...(guilda?[botao('Entrar',()=>aceitarGuilda(item.guildId))]:[]),
      botao('Recusar',()=>rejeitarGuilda(item.guildId),'social-secondary')
    ]);
  }));
  if(seq===renderConvitesSeq) area.replaceChildren(...rows);
}
async function renderGuildas() {
  const seq=++renderGuildasSeq, area=el('socialGuildas');
  if(!guildas.length) return vazio(area,'Você ainda não participa de nenhuma guilda.');
  const cards=await Promise.all(guildas.map(async guilda=>{
    const holder=bloco('article','social-guild');
    const head=bloco('div','social-guild-head');
    head.append(bloco('span','social-tag',guilda.tag), bloco('strong','',guilda.name));
    holder.append(head);
    if (guilda.description) holder.append(bloco('p','social-sub',guilda.description));
    const leader = guilda.leaderUid===usuario.uid;
    holder.append(bloco('p','social-sub',`👥 ${guilda.memberUids.length}/20 integrantes · ${leader?'Você é o líder':'Membro'}`));
    const names = await Promise.all(guilda.memberUids.map(async m=>(m===usuario.uid ? 'Você' : await pegarPerfil(m).catch(()=> 'Aventureiro'))));
    const members = bloco('div','social-members');
    names.forEach((nome,i)=>members.append(bloco('span','social-member',(guilda.memberUids[i]===guilda.leaderUid?'👑 ':'')+nome)));
    holder.append(members);
    const cmds=bloco('div','social-actions');
    if(leader) {
      const elegiveis=amizades.map(a=>a.members.find(m=>m!==usuario.uid)).filter(x=>!guilda.memberUids.includes(x));
      if(elegiveis.length && guilda.memberUids.length<20) {
        const linha=bloco('div','social-inputs');
        const select=bloco('select');select.setAttribute('aria-label','Escolher amigo para guilda');
        const opDefault=bloco('option','', 'Selecione um amigo');opDefault.value='';select.append(opDefault);
        for(const id of elegiveis) { const op=bloco('option','',await pegarPerfil(id).catch(()=> 'Aventureiro'));op.value=id;select.append(op); }
        linha.append(select,botao('Convidar',()=>convidarAmigo(guilda.id,select.value)));
        holder.append(linha);
      } else if(guilda.memberUids.length>=20) holder.append(bloco('p','social-muted','Guilda completa.'));
      cmds.append(botao('Encerrar guilda',()=>encerrarGuilda(guilda.id),'social-danger'));
    } else cmds.append(botao('Sair da guilda',()=>sairGuilda(guilda.id),'social-secondary'));
    holder.append(cmds);
    return holder;
  }));
  if(seq===renderGuildasSeq) area.replaceChildren(...cards);
}
function observar(reference, onData, description) {
  const cancelar = onSnapshot(reference,
    snap=>{ onData(snap.docs.map(d=>({id:d.id,...d.data()}))); },
    err=>feedback(`Não foi possível acompanhar ${description}. ${mensagemErro(err)}`,true));
  disposers.push(cancelar);
}
export function inicializarSocial(user, nomeAtual) {
  if (usuario) return; // Uma vez por sessão (o site recarrega ao trocar a conta).
  banco = getFirestore(getApp());
  usuario=user;
  obterNickname=nomeAtual;
  const codigo=codec(usuario.uid);
  el('socialMeuCodigo').textContent=codigo;
  el('socialCopiarCodigo').addEventListener('click',async()=>{
    try { await navigator.clipboard.writeText(codigo); feedback('Código copiado! Envie apenas aos seus amigos.'); }
    catch { feedback('Copie o código mostrado na tela manualmente.',true); }
  });
  el('socialEnviarAmizade').addEventListener('submit',e=>{
    e.preventDefault();
    acao(()=>enviarAmizade(),el('socialEnviarAmizade').querySelector('button'));
  });
  el('socialCriarGuilda').addEventListener('submit',e=>{
    e.preventDefault();
    acao(()=>criarGuilda(),el('socialCriarGuilda').querySelector('button'));
  });
  atualizarPerfilSocial(obterNickname?.());
  observar(collection(banco,'friendRequests',usuario.uid,'incoming'), lista=>{
    pedidos=lista; void renderPedidos();
  },'pedidos de amizade');
  observar(query(collection(banco,'friendships'),where('members','array-contains',usuario.uid)), lista=>{
    amizades=lista; void renderAmigos(); void renderGuildas();
  },'amizades');
  observar(collection(banco,'guildInvites',usuario.uid,'incoming'), lista=>{
    convitesGuilda=lista; void renderConvitesGuilda();
  },'convites para guildas');
  observar(query(collection(banco,'guilds'),where('memberUids','array-contains',usuario.uid)), lista=>{
    guildas=lista; void renderGuildas();
  },'guildas');
  feedback('Sistema social conectado. Compartilhe seu código com um amigo!');
}
