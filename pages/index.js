<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Layout Básico</title>
    <style>
        /* Estilos globais */
        body, html {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        .container {
            text-align: center;
            padding: 20px;
        }
        /* Estilizando o cabeçalho */
        .header {
            border-bottom: 2px solid #000;
        }
        /* Estilizando o conteúdo principal */
        .main-content {
            border-bottom: 2px solid #000;
            min-height: 400px; /* Apenas para visualização */
            color: rgb(45, 75, 134); /* Altera a cor do texto para azul */
        }
        /* Estilizando o rodapé */
        .footer {
            border-top: 2px solid #000;
            color: rgb(45, 75, 134); /* Altera a cor do texto para azul */
        }
        body {
            background-color: rgb(227, 227, 238);
            color: white;
            font: normal 20pt Arial;
        }
        h1 {
            color:rgb(45, 75, 134)
        }
    </style>
</head>
<body>

<div class="header container">
<img src="https://github.com/ricardoq4p/clone-tabnews/blob/main/PanteraLab.png?raw=true" alt="Logo Pantera Lab" style="height: 100px;"> <!-- Ajuste a altura conforme necessário -->
    <h1>Seu futuro mini-fórum!</h1>
</div>

<div class="main-content container">
    <p>SITE EM CONSTRUÇÃO!<br><br>

        <script>
            var nome = window.prompt('qual é o seu nome?')
            document.write(`Olá, <strong>${nome}</strong>! Seja bem-vindo ao seu futuro mini-fórum, em breve você poderá ter seu terreno aqui neste site!<br>`)
        </script>

    </p>
</div>

<div class="footer container">
    <p>Instagram @pug_pantera</p>
</div>

</body>
</html>