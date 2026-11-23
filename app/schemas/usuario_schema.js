// Rotas:
// CADASTRO - POST '/usuarios'
// LOGIN - POST '/login'
// VER TODOS - GET '/usuarios'
// VER POR ID - GET '/usuarios/:id'
// ATUALIZAR POR ID - PUT '/usuarios/:id'
// DELETAR POR ID - DELETE '/usuarios/:id'

// Dependências
const express = require('express')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcrypt')
const db = require('./app/database/db')

// Configuração do express
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'templates')))

// Configurção do bcrypt - Saltos
const salt_rounds = 10

// Função para campos não preenchidos
function isEmpty(value){
    return value === undefined || value === null || String(value).trim() === ''
}

// ===================
// CRUD Usuários
// ===================

// Cadastro - Usuários
app.post('/usuarios', async(req, res) => {
    const {nome, email, senha} = req.body

    if(isEmpty(nome) || isEmpty(email) || isEmpty(senha)){
        return res.status(400).json({message: 'Todos os campos são obrigatórios!'})
    }

    if(!email.includes('@' && '.')){
        return res.status(400).json({message: 'Insira um e-mail válido!'})
    }

    try{
        const [rows] = await db.query('SELECT id_user FROM users WHERE email = ?', [email])

        if(rows.length > 0){
            return res.status(409).json({message: 'Email já está em uso!'})
        }

        const hash = await bcrypt.hash(senha, salt_rounds)

        await db.query(
            'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)',
            [nome, email, hash] 
        )

        res.status(201).json({message: 'Usuário cadastrado com sucesso!'})

    }catch (error){
        console.error(error)
        res.status(500).json({message: 'Erro ao cadastrar usuário!'})

    }
})

// Login
app.post('/login', async(req, res) => {
    const {email, senha} = req.body

    if(isEmpty(email) || isEmpty(senha)){
        return res.status(400).json({message: 'E-mail e senha são obrigatórios!'})
    }

    if(!email.includes('@' && '.')){
    return res.status(400).json({message: 'Insira um e-mail válido!'})
    }

    try{
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email])
        const user = rows[0]

        if(!user){
            return res.status(404).json({message: 'Usuário não encontrado!'})
        }

        const senhaOK = await bcrypt.compare(senha, user.senha)

        if(!senhaOK){
            return res.status(401).json({message: 'Senha inválida!'})
        }

        res.status(200).json({message: 'Login realizado com sucesso!'})

    } catch(error){
        console.error(error)
        res.status(500).json({message: 'Erro ao realizar login!'})

    }

})

// Listar usuários
app.get('/usuarios', async(req, res) => {
    try{
        const [users] = await db.query('SELECT nome, email FROM users ORDER BY nome')
        res.json(users)

    }catch (error){
        console.error(error)
        res.status(500).json({message: 'Erro ao listar usuários!'})

    }
})

// Consultar usuário por ID
app.get('/usuarios/:id', async(req, res) => {
    const id = Number(req.params.id)

    if(!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({message: 'Informe um ID válido'})
    }

    try{
        const [users] = await db.query('SELECT * FROM users WHERE id_user = ?', [id])

        if(!users){
            return res.status(404).json({message: 'Usuário não encontrado!'})
        }

        res.json(users)

    }catch (error){
        console.log(error)
        res.status(500).json({message: 'Erro ao consultar usuário!'})

    }
})

// Atualizar usuário por ID
app.put('/usuarios/:id', async(req, res) => {
    const {nome, email, senha} = req.body
    const id = Number(req.params.id)

    if(!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({message: 'Informe um ID válido'})
    }

    if(isEmpty(nome) || isEmpty(email) || isEmpty(senha)){
        return res.status(400).json({message: 'Todos os campos são obrigatórios!'})
    }

    if(!email.includes('@' && '.')){
        return res.status(400).json({message: 'Insira um e-mail válido!'})
    }

    try{
        const [rows] = await db.query('SELECT * FROM users WHERE id_user = ?', [id])

        if (rows.length == 0){
            return res.status(404).json({message: 'Usuário não encontrado!'})
        }

        const hash = await bcrypt.hash(senha, salt_rounds)

        const [usuario] = await db.query(
            'UPDATE users SET nome = ?, email = ?, senha = ? WHERE id = ?',
            [nome, email, hash, id]
        )

    }catch (error){
        console.log(error)
        res.status(500).json({message: 'Erro ao consultar usuário!'})

    }
})

// Remover usuário
app.delete('/usuarios/:id', async(req, res) => {
    const id = Number(req.params.id)

    if(!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({message: 'Informe um ID válido'})
    }

    try{
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id])

        if (rows.length == 0){
            return res.status(404).json({message: 'Usuário não encontrado!'})
        }

        const remocao = await db.query('DELETE FROM users WHERE id = ?', [id])

        res.status(200).json({message: 'Remoção realizada com sucesso!'})

    } catch(error){
        console.error(error)
        res.status(500).json({message: 'Erro ao remover usuário!'})

    }
})