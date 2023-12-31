const { copyFile } = require("fs");
const eventoService = require("../services/evento.service");
const userService = require("../services/user.service");

// esta aplicacao se refere a enviar um convite pde um evento para um usuario da plataforma, este convite so pode ser feito pelo adm do evento.
// o adm do evento deve informar o id do evento e o id do usuario que ele deseja convidar

// o usuario que receber o convite deve aceitar ou recusar o convite, caso aceite ele passa a ser um participante do evento

const enviarConvite = async (req, res) => {
    const {
        idEvento,
        admID,
        convidado,
    } = req.body;

    if (!idEvento || !convidado || !admID) {
        res.status(400).send({
        message: "Todos os campos são obrigatórios"
        });
        return;
    }

    try {
        const userAdm = await userService.findUserByIdService(admID);

        if (!userAdm) {
        res.status(400).send({
            message: "Não foi possível encontrar o administrador do evento"
        });
        return;
        }

        const evento = await eventoService.findEventoByIdService(idEvento);

        if (!evento) {
            res.status(400).send({
                message: "Não foi possível encontrar o evento"
            });
            return;
        }
        if (evento.admID !== admID) {
            res.status(400).send({
                message: "Você não é o adm do evento"
            });
            return;
        
        }
        const user = await userService.findUserService(convidado);

        if (!user) {
            res.status(400).send({
                message: "Não foi possível encontrar o convidado"
            });
            return;
        }
        if (user.id === admID) {
            res.status(400).send({
                message: "Você não pode se convidar"
            });
            return;
        }
        //tava tentando fazer a verificação de convite repetido aqui, mas não consegui
        const conviteIndex = user.convites.findIndex(convite => convite._id.toString() === idEvento)
        if (conviteIndex !== -1) {
            res.status(400).send({
                message: "Usuário já foi convidado para este evento"
            });
            return;
        };
        const eventosConfirmadosIndex = user.eventosConfirmados.findIndex(evento => evento._id === idEvento)
        if (eventosConfirmadosIndex !== -1) {
            res.status(400).send({
                message: "Usuário já está confirmado neste evento"
            });
            return;
        };
        try {
            user.convites.push(evento._id);
            await user.updateOne(user);
            res.status(200).send({
                message: "Convite enviado com sucesso",
                user
                });
            } catch (error) {
            
                // Aqui você pode imprimir o erro para debug ou tratá-lo de outra forma
            }
    }
    catch (error) {
        res.status(400).send({
        message: "Não foi possível encontrar o usuário"
        });
        return;
    }
    
    }


    const aceitarConvite = async (req, res) => {
        const { idEvento, idUsuario, confirmar } = req.body;

        if (!idEvento || !idUsuario || !confirmar) {
            res.status(400).send({
                message: "Todos os campos são obrigatórios"
            });
            return;
        }

        try {
            const evento = await eventoService.findEventoByIdService(idEvento);

            if (!evento) {
                res.status(400).send({
                    message: "Não foi possível encontrar o evento"
                });
                return;
            }

            const user = await userService.findUserByIdService(idUsuario);

            if (!user) {
                res.status(400).send({
                    message: "Não foi possível encontrar o usuário"
                });
                return;
            }

            const conviteIndex = user.convites.findIndex(convite => convite._id.toString() === idEvento);

            if (conviteIndex === -1) {
                res.status(400).send({
                    message: "Convite não encontrado"
                });
                return;
            }
            if (user._id === evento.admID) {
                res.status(400).send({
                    message: "Você não pode enviar um convite para si mesmo"
                });
                return;
            }
            if (confirmar === "aceito") {
                const convidado = {
                    username: user.username,
                    idConvidado: user._id,
                    jaPagou: false,
                    createdAt: Date.now()
                }

                if(evento.convidados.includes(convidado)){
                    res.status(400).send({
                        message: "Usuario já está na lista de convidados"
                    });
                    return;
                }else{
                    user.convites[conviteIndex].status = "aceito";
                    evento.convidados.push(convidado);
                    user.eventosConfirmados.push(evento.id);
                    user.convites.splice(conviteIndex, 1);
                    await evento.updateOne(evento);
                    await user.updateOne(user);
                }
            } else if (confirmar === "recusado") {
                user.convites[conviteIndex].status = "recusado";
                user.convites.splice(conviteIndex, 1);
                await user.updateOne(user);
            }

            res.status(200).send({
                message: confirmar === "aceito" ? "Convite aceito com sucesso" : "Convite recusado com sucesso",
                userconvites: user.convites
            });
        } catch (error) {
            res.status(500).send({
                message: "Erro ao aceitar convite"
            });
        }
    };

const findConvidados = async (req, res) => {

    try {
        const evento = await eventoService.findEventoByIdService(req.body.idEvento);

        if (!evento) {
            res.status(400).send({
                message: "Não foi possível encontrar o evento"
            });
            return;
        }

        res.status(200).send({
            message: "Lista de convidados",
            convidados: evento.convidados
        });
    } catch (error) {
        res.status(500).send({
            message: "Erro ao listar convidados"
        });
    }
};

const alterarConvidados = async (req, res) => {
    const { idEvento, idConvidado, jaPagou } = req.body;

    if (!idEvento || !idConvidado || !jaPagou) {
        res.status(400).send({
            message: "Todos os campos são obrigatórios"
        });
        return;
    }

    try {
        const evento = await eventoService.findEventoByIdService(idEvento);

        if (!evento) {
            res.status(400).send({
                message: "Não foi possível encontrar o evento"
            });
            return;
        }

        const convidadoIndex = evento.convidados.findIndex(convidado => convidado.idConvidado && convidado.idConvidado.toString() === idConvidado);

        if (convidadoIndex === -1) {
            res.status(400).send({
                message: "Não foi possível encontrar o convidado"
            });
            return;
        }

        if (evento.convidados[convidadoIndex]) {
            evento.convidados[convidadoIndex].jaPagou = jaPagou; 
        }
        
        await evento.updateOne(evento);

        res.status(200).send({
            message: "Convidado atualizado com sucesso",
            convidados: evento.convidados
        });
    } catch (error) {
        res.status(500).send({
            message: "Erro ao atualizar convidado"
        });
    };
};

const deletarConvidado = async (req, res) => {
    const { idEvento, idConvidado } = req.body;

    if (!idEvento || !idConvidado) {
        res.status(400).send({
            message: "Todos os campos são obrigatórios"
        });
        return;
    }

    try {
        const evento = await eventoService.findEventoByIdService(idEvento);

        if (!evento) {
            res.status(400).send({
                message: "Não foi possível encontrar o evento"
            });
            return;
        }

        const convidadoIndex = evento.convidados.findIndex(convidado => convidado.idConvidado && convidado.idConvidado.toString() === idConvidado);

        if (convidadoIndex === -1) {
            res.status(400).send({
                message: "Não foi possível encontrar o convidado"
            });
            return;
        }

        const convidado = await userService.findUserByIdService(idConvidado);
        const index = convidado.eventosConfirmados.indexOf(evento._id);
        if (index > -1){
            convidado.eventosConfirmados.splice(index, 1);
            await convidado.updateOne(convidado);
        }else{
            return res.status(400).json({ message: "Evento não encontrado" });
        }
        evento.convidados.splice(convidadoIndex, 1);
        await evento.updateOne(evento);

        res.status(200).send({
            message: "Convidado removido com sucesso",
            convidados: evento.convidados
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Erro ao remover convidado"
        });
    };
};




module.exports = { enviarConvite, aceitarConvite, findConvidados, alterarConvidados,deletarConvidado}