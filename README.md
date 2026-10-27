# 🏛️ Site Institucional | Lucas Fernando Tomaz Bento - Advogado

Este repositório contém o código-fonte do site institucional e landing page para o Dr. Lucas Fernando Tomaz Bento, OAB/SC 66.081.

## 🌟 Visão Geral do Projeto

Este site foi desenvolvido com foco em **performance, design responsivo** e **captação de leads** (contatos) para o escritório de advocacia.

### 🛠️ Tecnologias Utilizadas

* **HTML5:** Estrutura semântica do conteúdo.
* **CSS3 (Puro):** Estilização completa e design customizado.
* **JavaScript (Puro):** Para interações como o carrossel de depoimentos e a CTA *sticky* (botão fixo).
* **SVG:** Ícones vetoriais próprios.
* **Google Forms, Sheets e Apps Script:** Coleta e moderação de avaliações.

### 🚀 Funcionalidades Principais

* **Design Responsivo:** Adaptável a celulares, tablets e desktops.
* **Depoimentos moderados:** Cards com giro para a esquerda, nota real de 1 a 5, controles manuais e pausa. Apenas avaliações autorizadas e aprovadas são exibidas.
* **Formulário de Contato:** Área de interesse contextualizada, validação de telefone e envio pelo Formspree.
* **Otimização:** Uso de fontes importadas e estrutura limpa para carregamento rápido.

## 🔗 Como Acessar o Site

Este projeto está hospedado gratuitamente utilizando o **GitHub Pages**.

**Link do Site Publicado:** (https://maharadev.github.io/LucasADV/)

## Desenvolvimento e validação

O projeto é estático e não exige etapa de build. Sirva a pasta por um servidor HTTP local para testar os recursos externos.

```sh
node --test tests/contact-context.test.cjs tests/reviews.test.cjs
```

## Publicação

O conteúdo público fica na raiz do repositório. Preserve os caminhos relativos de `img/`, CSS e JavaScript ao publicar em GitHub Pages ou na hospedagem.

Domínio do escritório: https://lucasfernandoadv.com.br/

## Avaliações e privacidade

A configuração do feed público está em `reviews-config.js`. Ela contém apenas endereços públicos, sem credenciais. A instalação genérica do serviço está documentada em `integracoes/avaliacoes/README.md`. A planilha e os links de administração permanecem privados e não fazem parte da publicação.

## Acessibilidade

Navegação por teclado, foco visível, menu responsivo, mensagens acessíveis no formulário e respeito à preferência por movimento reduzido. O favicon inclui versões SVG, PNG e ICO.
