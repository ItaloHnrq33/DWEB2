const jwt = require('jsonwebtoken');

function generateToken(userInfo) {
    if (!userInfo) {
        return null;
    }

    return jwt.sign(userInfo, process.env.JWT_SECRET, {
        expiresIn: '2h'
    })
}

function verifyToken(username, token) {
    return jwt.verify(token, process.env.JWT_SECRET, (error, response) => {
        if (error) {
            return {
                verified:false,
                message: 'Token Invalido'
            }
        }

        if (response.username !== username) {
            return {
                verified: false,
                message: 'Usuário invalido'
            }
        }

        return {
            verified: true,
            message: 'Tudo Ok, meu chapa'
        }
    })
}

module.exports.generateToken = generateToken;