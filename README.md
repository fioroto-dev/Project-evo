# ⚔️ PROJECT EVO

### Transforme hábitos em missões. Evolua a cada dia.

**PROJECT EVO (Projeto Evolução)** é uma aplicação web de produtividade gamificada com elementos de RPG. Em vez de apenas marcar tarefas, o jogador cria missões, ganha experiência (XP), desenvolve atributos, desbloqueia conquistas, progride pelos ranks e pode formar amizades e guildas com outros usuários.

🌐 **Site:** [project-evo-a8d9a.web.app](https://project-evo-a8d9a.web.app)

> Projeto desenvolvido com HTML, CSS e JavaScript puro, autenticação pelo Firebase e armazenamento em nuvem pelo Cloud Firestore.

---

## ✨ Funcionalidades

### 🎯 Missões e evolução

- **Missões personalizadas:** cada jogador cria tarefas com título, dificuldade e atributo relacionado.
- **Recompensa em XP:** ao concluir uma missão, o jogador recebe experiência; ao desmarcá-la, o sistema ajusta a pontuação.
- **Dificuldades disponíveis:**

  | Dificuldade | XP por missão |
  | --- | ---: |
  | Fácil | 10 XP |
  | Média | 25 XP |
  | Difícil | 50 XP |
  | Extrema | 100 XP |

- **Renovação diária:** missões podem voltar ao estado pendente no horário configurado pelo usuário, sem apagar o XP acumulado.
- **Sequência diária:** acompanha dias consecutivos com pelo menos uma missão concluída, com ícone de chama animada.
- **Histórico:** registro de atividades e missões concluídas.

### 🏆 Sistema de ranks

O jogador começa no **rank F** e progride até o **rank SS**. Cada rank possui um emblema próprio e a barra de XP mostra a evolução até o próximo nível.

| Rank | XP mínimo padrão |
|:---:|---:|
| F | 0 |
| E | 100 |
| D | 250 |
| C | 500 |
| B | 900 |
| A | 1.500 |
| S | 2.500 |
| SS | 4.000 |

Os requisitos de XP dos ranks podem ser personalizados nas configurações do site, respeitando as validações do sistema.

### 📊 Atributos do personagem

Cada missão contribui para um dos sete atributos:

**Força · Inteligência · Velocidade · Saúde · Resistência · Sabedoria · Carisma**

### 👤 Perfil e personalização

- Nickname e foto de perfil.
- Títulos e conquistas desbloqueáveis.
- Temas e configurações de aparência.
- Efeitos visuais e opções de som.
- Sistema de ajuda com o personagem **Ren**.
- Animação de abertura com o emblema e o título **PROJECT EVO**.
- Exportação de backup do progresso em formato JSON.

### 🤝 Amigos e guildas

- Código exclusivo de jogador no formato `EVO-...`.
- Envio, recebimento, aceitação e recusa de pedidos de amizade.
- Lista de amigos e opção de remover amizades.
- Criação de guildas com **nome, sigla, descrição e líder**.
- Convites de guilda enviados pelo líder aos amigos.
- Aceitação ou recusa dos convites.
- Até **20 membros por guilda**.
- Saída voluntária de membros e encerramento da guilda pelo líder.

O sistema social compartilha apenas um perfil público mínimo (nickname e identificação do jogador). E-mail, senha, foto pessoal e histórico de missões não fazem parte dos dados sociais públicos.

### 🔐 Contas e sincronização

- Cadastro e login com **e-mail e senha**.
- Login com **conta Google**.
- Recuperação de senha e saída da conta.
- Progresso individual vinculado ao **UID** do Firebase Authentication.
- Sincronização com o **Cloud Firestore** e cópia local por usuário para ajudar em interrupções de conexão.

---

## 🧰 Tecnologias utilizadas

| Tecnologia | Finalidade |
| --- | --- |
| HTML5 | Estrutura do site |
| CSS3 | Interface, responsividade e animações |
| JavaScript (ES Modules) | Regras de missões, RPG e funções sociais |
| Firebase Authentication | Cadastro, login Google e e-mail/senha |
| Cloud Firestore | Progresso e recursos sociais na nuvem |
| Firebase Hosting | Hospedagem pública do site |
| Firebase CLI | Implantação do site e regras de segurança |

O site **não depende de React, Vue ou servidor Node.js próprio**. O Node.js é usado no computador do desenvolvedor para executar o Firebase CLI.

## 📁 Estrutura do projeto

```text
Projeto_Evolucao_Firebase_Pronto/
├── public/
│   ├── index.html              # Interface, estilos, missões e animações
│   ├── firebase-config.js      # Configuração do aplicativo web Firebase
│   ├── firebase-auth-sync.js   # Login e sincronização de progresso
│   └── firebase-social.js      # Amigos, pedidos e guildas
├── firebase.json               # Configuração do Hosting e Firestore
├── firestore.rules             # Regras de acesso ao banco
├── .gitignore
└── README.md                   # Documentação do projeto
```

> Na versão atual, o ícone e o controle da introdução estão incorporados ao `index.html`; não é necessário publicar `intro.js` ou `intro-logo.webp` separadamente.

---

## 🚀 Instalação e configuração

### 1. Requisitos

- [Node.js](https://nodejs.org/) instalado (preferencialmente versão LTS).
- Uma conta Google com acesso ao [Firebase Console](https://console.firebase.google.com/).
- Um projeto Firebase com aplicativo Web cadastrado.
- Firebase Authentication com os provedores **Google** e **E-mail/senha** habilitados.
- Um banco **Cloud Firestore** criado no projeto.

### 2. Configure o Firebase

No Firebase Console, abra **Configurações do projeto → Seus aplicativos → Configuração do SDK** e copie os valores do aplicativo Web para `public/firebase-config.js`.

O arquivo precisa manter a exportação:

```javascript
export const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

**Importante:** o `firebaseConfig` do SDK Web não é uma senha, mas **nunca** coloque credenciais privadas, chaves de conta de serviço ou senhas de usuários no código.

Em **Authentication → Configurações → Domínios autorizados**, confirme que os domínios usados pelo site estão autorizados.

### 3. Instale e autentique o Firebase CLI

Abra o terminal **na pasta principal do projeto**, onde está `firebase.json`.

**Windows / PowerShell:**

```powershell
npm.cmd install -g firebase-tools
firebase.cmd login
```

O uso de `.cmd` evita problemas comuns de bloqueio do `npm.ps1` no PowerShell.

### 4. Publique o site e as regras do Firestore

Para a primeira publicação ou sempre que `firestore.rules` for alterado:

```powershell
firebase.cmd deploy --project project-evo-a8d9a --only "hosting,firestore:rules"
```

Para usar outro projeto Firebase, substitua `project-evo-a8d9a` pelo `projectId` correspondente.

**Atenção:** a publicação de `firestore:rules` substitui as regras atuais do banco configurado. Revise-as antes de publicar se o mesmo Firestore atender a outros aplicativos.

### 5. Atualizações futuras

Quando houver mudanças **somente nos arquivos do site** (`public/`), execute:

```powershell
firebase.cmd deploy --project project-evo-a8d9a --only hosting
```

O endereço público permanece o mesmo. Uma atualização do Hosting, por si só, não apaga os documentos já gravados no Firestore.

### 6. Teste local (opcional)

Não abra o `index.html` diretamente como `file://`. Você pode servir a pasta `public` localmente, por exemplo, com Python:

```powershell
python -m http.server 8000 --directory public
```

Acesse `http://localhost:8000` e verifique se `localhost` está cadastrado nos domínios autorizados do Firebase Authentication. Para login Google, permita pop-ups do navegador quando necessário.

---

## 🗃️ Organização de dados no Firestore

O projeto utiliza coleções e documentos semelhantes aos seguintes:

```text
users/{uid}/progress/current
publicProfiles/{uid}
friendRequests/{destinatarioUid}/incoming/{remetenteUid}
friendships/{parDeUids}
guilds/{guildId}
guildInvites/{destinatarioUid}/incoming/{guildId}
```

- **Progresso:** somente a conta proprietária pode ler e gravar seus dados.
- **Perfis sociais:** contêm nickname, sem e-mail e histórico de missões.
- **Amizades:** dependem de pedidos enviados e aceitos.
- **Guildas:** a entrada de novos membros depende de convites válidos; o líder administra convites e encerramento.

Essas restrições são aplicadas pelas regras do arquivo `firestore.rules`. A verificação não deve depender apenas do JavaScript do navegador.

## ✅ Testes recomendados após publicar

1. Criar uma conta com e-mail e senha e entrar novamente.
2. Testar o login com Google e a recuperação de senha.
3. Criar uma missão, concluir, receber XP e recarregar o site.
4. Entrar em outro dispositivo e conferir o progresso sincronizado.
5. Usar **duas contas de teste** para enviar e aceitar um pedido de amizade.
6. Criar uma guilda, convidar um amigo e aceitar o convite na outra conta.
7. Confirmar que um usuário não consegue acessar o progresso privado de outro.
8. Verificar se a introdução termina automaticamente e se a interface funciona no celular.

## 🔎 Observações e limitações atuais

- O sistema social necessita de conexão à internet para acessar o Firestore.
- Não há **chat de guilda**, busca pública por e-mail ou ranking global nesta versão.
- Atualmente um jogador pode participar de **mais de uma guilda**.
- A sincronização do progresso usa um documento principal por jogador. Edições simultâneas em vários dispositivos podem sobrescrever umas às outras (a última gravação prevalece).
- O Firestore possui limites de armazenamento e operações; consulte as cotas e preços do seu projeto.
- O recurso de backup permite **exportar JSON**. Não considere uma restauração automática de arquivos JSON disponível sem implementar e testar uma função de importação correspondente.
- Antes de atualizações grandes, faça backup da pasta do projeto e dos dados importantes.

## 💡 Possíveis expansões

Ideias para futuras versões, **ainda não implementadas**:

- Missões cooperativas e recompensas coletivas para guildas.
- Ranking entre amigos e guildas.
- Chat moderado e notificações de convites.
- Eventos temporários e desafios especiais.
- Conquistas sociais e personalização dos emblemas das guildas.

## 📄 Licença

A licença de uso e redistribuição **ainda não foi definida**. Antes de disponibilizar o código para terceiros, adicione um arquivo `LICENSE` com os termos desejados.

---

<p align="center"><strong>PROJECT EVO</strong><br>Uma missão de cada vez. Uma evolução a cada dia. ⚔️</p>
