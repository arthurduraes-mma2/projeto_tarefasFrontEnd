require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');

const app = express();

app.use(cors());
app.use(express.json());

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

app.post('/tarefas', async (req, res) => {
    try {
        const { nome, descricao, responsavel, data_tarefa, concluido } = req.body;

        if (!nome || !responsavel || !data_tarefa) {
            return res.status(400).json({
                mensagem: 'Nome, responsável e data são obrigatórios.'
            });
        }

        const resultado = await pool.query(
            `INSERT INTO tarefas (nome, descricao, responsavel, data_tarefa, concluido)
            VALUES (?, ?, ?, ?, ?)`,
            [nome, descricao || null, responsavel, data_tarefa, concluido ?? false]
        );

        res.status(201).json({
            mensagem: 'Tarefa cadastrada com sucesso!',
            id: Number(resultado.insertId)
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro ao cadastrar tarefa.' });
    }
});

app.get('/tarefas/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ mensagem: 'ID inválido.' });
        }

        const tarefas = await pool.query(
            'SELECT * FROM tarefas WHERE id = ?',
            [id]
        );

        if (tarefas.length === 0) {
            return res.status(404).json({ mensagem: 'Tarefa não encontrada.' });
        }

        res.json(tarefas[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro ao consultar tarefa.' });
    }
});

app.get('/tarefas', async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        if (!data_inicio || !data_fim) {
            return res.status(400).json({
                mensagem: 'Informe data_inicio e data_fim.'
            });
        }

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(data_inicio) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(data_fim) ||
            data_inicio > data_fim
        ) {
            return res.status(400).json({
                mensagem: 'Informe um período válido (AAAA-MM-DD).'
            });
        }

        const tarefas = await pool.query(
            `SELECT * FROM tarefas
            WHERE data_tarefa BETWEEN ? AND ?
            ORDER BY data_tarefa ASC`,
            [data_inicio, data_fim]
        );

        res.json(tarefas);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro ao listar tarefas.' });
    }
});

app.put('/tarefas/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, descricao, responsavel, data_tarefa, concluido } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ mensagem: 'ID inválido.' });
        }

        if (!nome || !responsavel || !data_tarefa || typeof concluido !== 'boolean') {
            return res.status(400).json({
                mensagem: 'Informe todos os campos obrigatórios.'
            });
        }

        const resultado = await pool.query(
            `UPDATE tarefas
            SET nome = ?, descricao = ?, responsavel = ?,
                data_tarefa = ?, concluido = ?
            WHERE id = ?`,
            [nome, descricao ?? null, responsavel, data_tarefa, concluido, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Tarefa não encontrada.' });
        }

        res.json({ mensagem: 'Tarefa atualizada com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro ao atualizar tarefa.' });
    }
});

app.delete('/tarefas/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ mensagem: 'ID inválido.' });
        }

        const resultado = await pool.query(
            'DELETE FROM tarefas WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Tarefa não encontrada.' });
        }

        res.json({ mensagem: 'Tarefa excluída com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro ao excluir tarefa.' });
    }
});

const PORTA = 3000;

app.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`);
});