
const btns = document.querySelectorAll(".dropdown-btn");

btns.forEach(btn => {
    btn.addEventListener("click", (e) => {

        e.stopPropagation(); // evita fechar imediatamente

        const submenu = btn.nextElementSibling;
        const arrow = btn.querySelector(".arrow");

        // Fecha os outros
        document.querySelectorAll(".submenu").forEach(menu => {
            if (menu !== submenu) menu.classList.remove("open");
        });

        document.querySelectorAll(".arrow").forEach(a => {
            if (a !== arrow) a.classList.remove("rotate");
        });

        // Alterna atual
        submenu.classList.toggle("open");
        arrow.classList.toggle("rotate");
    });
});



document.addEventListener("click", () => {

    document.querySelectorAll(".submenu").forEach(menu => {
        menu.classList.remove("open");
    });

    document.querySelectorAll(".arrow").forEach(a => {
        a.classList.remove("rotate");
    });

});

const toggle = document.querySelector(".btn_menu");
const nav = document.querySelector(".nav");


toggle.addEventListener("click", () => {
    nav.classList.toggle("active");
});


const form = document.getElementById("form_motorista");

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const nome = document.getElementById("txf_nome_add_motorista").value.trim();
    const data = document.getElementById("txf_data_add_motorista").value.trim();
    const cpf = document.getElementById("txf_cpf_add_motorista").value.trim();
    const habilitacao = document.getElementById("txf_registro_add_motorista").value.trim();
    const categoria = document.getElementById("ddl_carteira_add_motorista").value;
    const senha = document.getElementById("pwd_senha_add_motorista").value.trim();
    const confirmacaoSenha = document.getElementById("pwd_conf_senha_add_motorista").value.trim();

    if (
        nome === "" ||
        data === "" ||
        cpf === "" ||
        habilitacao === "" ||
        categoria === "" ||
        senha === "" ||
        confirmacaoSenha === ""
    ) {
        alert("Preencha todos os campos!");
        return;
    }

    if (senha !== confirmacaoSenha) {
    alert("As senhas não coincidem!");
    return;
    }

    console.log("Validação OK");

    const dados = {
        nome,
        data,
        cpf,
        habilitacao,
        categoria,
        senha
    };

    console.log("Dados enviados", dados);

            const API_URL = "URL_DO_BACKEND_AQUI";

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
    }).then(() => {
        form.reset();
    });


});

