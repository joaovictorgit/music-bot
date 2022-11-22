# Music Bot

## Sobre
Aplicação, desenvolvida usando node.js, que cria um bot no discord que toca música. O bot pode tocar uma música caso o usuário digite apenas o link ou uma lista de músicas caso digite o nome do artista. Caso ele digite o nome do artista é exibido uma lista de músicas que o usários pode escolher qual deseja que toque.

## Tecnologias
 - discord.js
 - ytdl-core
 - googleapis

## Comandos
 - O usuário entra no canal de voz e digite este comando para que o bot entre.
        
        !join
 - O comando !play faz com que o bot toque a música.

        !play <url> ou !play <artista>
 - Pause a música.

        !pause
 - Retorna a tocar a música.
    
        !resume