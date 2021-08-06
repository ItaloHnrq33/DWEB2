const AWS = require('aws-sdk');
AWS.config.update( {
    region: 'us-east-2'
  });

const build = require('../exports/buildResponse');
const bcrypt = require('bcryptjs');
const auth = require('../exports/auth');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = 'productsdb';


async function login(user) {
    const username = user.username;
    const password = user.password;
    if (!user || !username || !password) {
      return build.buildResponse(401, {
        message: 'Usuário e senha são obrigatórios'
      })
    }
  
    const dbUser = await getUser(username.toLowerCase().trim());
    if (!dbUser || !dbUser.username) {
      return build.buildResponse(403, { message: 'Usuário não existe'});
    }
  
    if (!bcrypt.compareSync(password, dbUser.password)) {
      return build.buildResponse(403, { message: 'Senha incorreta!'});
    }
  
    const userInfo = {
      username: dbUser.username,
      name: dbUser.name
    }
    const token = auth.generateToken(userInfo)
    const response = {
      user: userInfo,
      token: token
    }
    return build.buildResponse(200, response);
  }
  
  async function getUser(username) {
    const params = {
      TableName: userTable,
      Key: {
        username: username
      }
    }
  
    return await dynamodb.get(params).promise().then(response => {
      return response.Item;
    }, error => {
      console.error(error);
    })
  }
  
  module.exports.login = login;