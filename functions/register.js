const AWS = require('aws-sdk');
AWS.config.update( {
    region: 'us-east-2'
  });
const build = require('../exports/buildResponse');
const bcrypt = require('bcryptjs');


const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = 'productsdb';

async function register(userInfo) {
  const name = userInfo.name;
  const email = userInfo.email;
  const username = userInfo.username;
  const password = userInfo.password;
  if (!username || !name || !email || !password) {
    return build.buildResponse(401, {
      message: 'Por favor, todos os campos devem ser preenchidos"'
    })
  } 

  const dbUser = await getUser(username.toLowerCase().trim());
  if (dbUser && dbUser.username) {
    return util.buildResponse(401, {
      message: 'O Usuário já existe!'
    })
  }

  const encryptedPassWord = bcrypt.hashSync(password.trim(), 10);
  const user = {
    name: name,
    email: email,
    username: username.toLowerCase().trim(),
    password: encryptedPassWord
  }

  const saveUserResponse = await saveUser(user);
  if (!saveUserResponse) {
    return build.buildResponse(503, { message: 'Server Error'});
  }

  return build.buildResponse(200, { username: username });
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
      console.error('Erro ao procurar o usuario', error);
    })
  }
  
  async function saveUser(user) {
    const params = {
      TableName: userTable,
      Item: user
    }
    return await dynamodb.put(params).promise().then(() => {
      return true;
    }, error => {
      console.error(error)
    });
  }
  
  module.exports.register = register;

