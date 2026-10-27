# Avaliações reais — instalação e operação

A landing já contém a seção e o carregamento automático. Ela permanece oculta até receber pelo menos um depoimento autorizado e aprovado. Nenhuma avaliação de exemplo é publicada.

## 1. Criar o formulário e a planilha na conta do escritório

1. Abra https://script.google.com/ e crie um projeto chamado **Avaliações — Lucas Fernando**.
2. Substitua o conteúdo de `Código.gs` pelo conteúdo completo de `Code.gs` desta pasta. Salve.
3. Selecione a função **instalar** e clique em **Executar**. Confira as permissões e autorize na conta que administrará as avaliações. O instalador usa Google Forms, planilhas e um gatilho de envio; não envia e-mails.
4. O registro de execução mostrará links da **planilha privada**, de **edição do formulário** e do **formulário para clientes**. Guarde-os.
5. Abra o formulário de edição, revise a identificação do escritório e o texto de autorização. Confira o acesso dos respondentes e clique em **Publicar** no Forms. Não habilite a exibição do resumo de respostas para participantes.

O instalador pode ser executado novamente sem duplicar os arquivos ou gatilhos concluídos. Se a criação das perguntas for interrompida, ele interrompe uma nova tentativa para não duplicá-las: confira o formulário antes de reparar a configuração parcial.

## 2. Publicar o serviço que entrega somente avaliações aprovadas

No editor Apps Script:

1. Clique em **Implantar → Nova implantação → Aplicativo da Web**.
2. Em **Executar como**, selecione sua própria conta (proprietário).
3. Em **Quem pode acessar**, selecione **Qualquer pessoa**, incluindo visitantes sem login. Se a conta não permitir acesso público, será necessário ajustar a opção com o administrador ou usar outra hospedagem para o serviço.
4. Implante e copie o endereço terminado em `/exec`.

Este endereço é público, mas só entrega identificação pública, texto autorizado, data e origem das avaliações aprovadas. A planilha e as respostas originais continuam privadas. **Não publique a planilha na Web nem altere seu compartilhamento para público.**

## 3. Conectar a landing

No arquivo `reviews-config.js`, preencha:

```js
window.REVIEWS_CONFIG = Object.freeze({
  endpoint: 'COLE_AQUI_O_ENDERECO_DO_APLICATIVO_TERMINADO_EM_EXEC',
  formUrl: 'COLE_AQUI_O_LINK_PUBLICO_DO_FORMULARIO'
});
```

Não coloque o link de edição do formulário, link da planilha, senha ou token neste arquivo. Publique os arquivos atualizados da landing, incluindo `reviews-config.js` e `reviews.js`, pela hospedagem já utilizada.

## 4. Conferir antes de liberar

1. Envie uma resposta de teste identificada como teste pelo link do formulário.
2. Ela deve aparecer na aba de respostas e na aba **Moderação**, com **Publicar** desmarcado.
3. Abra o `/exec` em uma janela sem login: o texto de teste não pode aparecer.
4. Se autorizou a publicação no teste, marque **Publicar** e confira novamente o `/exec` e a landing. Apague/desmarque o teste depois da verificação; não o deixe como avaliação real.
5. Uma resposta sem autorização não deve aparecer, mesmo se **Publicar** estiver marcado.
6. Desmarque **Publicar**: ao atualizar a página, o depoimento deve desaparecer. Uma página já aberta consulta o serviço a cada dois minutos enquanto a aba estiver visível.
7. Confira a landing na hospedagem real em desktop e celular. O carregamento via Google depende do acesso público, das permissões e dos redirecionamentos do Apps Script. Se o navegador bloquear a consulta, a seção fica oculta; não declare a integração ativa antes desse teste.

## 5. Rotina de aprovação

Na aba **Moderação**, confira autenticidade, identificação permitida, autorização e ausência de dados de terceiros ou detalhes de processos. Só então marque **Publicar**. O filtro não distingue opiniões positivas e negativas: exibe até seis avaliações aprovadas mais recentes.

Não altere a autorização para transformar uma recusa em aceite. Preserve os textos originais; se houver informação que impeça a publicação, mantenha a resposta privada e solicite nova versão ao autor pelo canal adequado.

Para retirar um depoimento, desmarque **Publicar**. A integração não mantém cópia persistente no navegador. Em caso de indisponibilidade do serviço, oculta os cards em vez de continuar mostrando conteúdo possivelmente retirado. Para exclusão completa, remova também a resposta do Forms e as respectivas linhas da aba de respostas e da aba Moderação, conforme a solicitação do titular.

As estrelas representam a nota real de 1 a 5 enviada pelo autor. Avaliações antigas sem nota aparecem sem estrelas. Não há nota média, selo de cliente verificado ou vínculo com Google Maps. A origem exibida é o formulário do escritório. O formulário, por si só, não comprova que o autor foi cliente.

## Manutenção

- Alterações em `Code.gs` exigem atualizar a implantação existente para uma **nova versão**, mantendo o endereço `/exec` configurado.
- Não renomeie a aba **Moderação** nem reordene suas sete colunas.
- Não exclua/recrie perguntas do Forms sem ajustar os IDs nas propriedades do script. Mudanças na redação das opções de autorização também exigem atualização do código.
- Se o gatilho falhar, confira **Execuções** e **Acionadores** no Apps Script. A resposta original continuará na planilha de respostas, mas não será publicada automaticamente.
- O serviço está sujeito às quotas do Google Apps Script. Para tráfego elevado, considere um backend com cache controlado e política explícita de remoção.

## Documentação oficial

- Forms: https://developers.google.com/apps-script/reference/forms/form-app
- Gatilho de envio: https://developers.google.com/apps-script/guides/triggers/installable
- Aplicativo da Web: https://developers.google.com/apps-script/guides/web
- Respostas JSON: https://developers.google.com/apps-script/guides/content

## Estrelas e cards

A instalação existente já foi atualizada para coletar nota de 1 a 5 na coluna G, com versão 2 do serviço. Para outra instalação anterior, execute atualizarEstrelas uma vez e atualize a implantação. Não atribua notas a depoimentos antigos. A landing alterna cards com giro para a esquerda, pausa e navegação manual. A rotação para ao receber foco e respeita movimento reduzido. Com apenas um depoimento, o card permanece estático.
