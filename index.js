const AWS = require('aws-sdk');
AWS.config.update( {
  region: 'us-east-2'
});

const loginCode = require('./functions/login');
const registerCode = require('./functions/register');
const verifyCode = require('./functions/verifyToken');

const build = require('./exports/buildResponse');


const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'productsdb';

const loginPath = '/login';
const registerPath = '/register';
const verifyToken = '/verify'
const statusPath = '/status';
const productPath = '/product';
const productsPath = '/products';

exports.handler = async function(event) {

  let response;
  switch(true) {
    case event.httpMethod === 'POST' && event.path === loginPath:
        const loginBody = JSON.parse(event.body);
        response = await loginCode.login(loginBody) ;
        break;
    case event.httpMethod === 'POST' && event.path === registerPath:
      const registerBody = JSON.parse(event.body);
      response = await registerCode.register(registerBody);
      break;
    case event.httpMethod === 'POST' && event.path === verifyPath:
      const verifyBody = JSON.parse(event.body);
      response = build.buildResponse(200);
      break;
    case event.httpMethod === 'GET' && event.path === statusPath:
      response = verifyCode.verify(verifyBody);
      break;
    case event.httpMethod === 'GET' && event.path === productPath:
      response = await getProduct(event.queryStringParameters.productId);
      break;
    case event.httpMethod === 'GET' && event.path === productsPath:
      response = await getProducts();
      break;
    case event.httpMethod === 'POST' && event.path === productPath:
      response = await saveProduct(JSON.parse(event.body));
      break;
    case event.httpMethod === 'PATCH' && event.path === productPath:
      const requestBody = JSON.parse(event.body);
      response = await updateProduct(requestBody.productId, requestBody.updateKey, requestBody.updateValue);
      break;
    case event.httpMethod === 'DELETE' && event.path === productPath:
      response = await deleteProduct(JSON.parse(event.body).productId);
      break;
    default:
      response = build.buildResponse(404, '404 Not Found');
  }
  return response;
}

async function getProduct(productId) {
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'productId': productId
    }
  }
  return await dynamodb.get(params).promise().then((response) => {
    return buildResponse(200, response.Item);
  }, (error) => {
    console.error(error);
  });
}

async function getProducts() {
  const params = {
    TableName: dynamodbTableName
  }
  const allProducts = await scanDynamoRecords(params, []);
  const body = {
    products: allProducts
  }
  return build.buildResponse(200, body);
}

async function scanDynamoRecords(scanParams, itemArray) {
  try {
    const dynamoData = await dynamodb.scan(scanParams).promise();
    itemArray = itemArray.concat(dynamoData.Items);
    if (dynamoData.LastEvaluatedKey) {
      scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
      return await scanDynamoRecords(scanParams, itemArray);
    }
    return itemArray;
  } catch(error) {
    console.error(error);
  }
}

async function saveProduct(requestBody) {
  const params = {
    TableName: dynamodbTableName,
    Item: requestBody
  }
  return await dynamodb.put(params).promise().then(() => {
    const body = {
      Message: 'PRODUTO SALVO COM SUCESSO NA FIBOSTORE',
      Item: requestBody
    }
    return build.buildResponse(200, body);
  }, (error) => {
    console.error(error);
  })
}

async function updateProduct(productId, updateKey, updateValue) {
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'productId': productId
    },
    UpdateExpression: `set ${updateKey} = :value`,
    ExpressionAttributeValues: {
      ':value': updateValue
    },
    ReturnValues: 'UPDATED_NEW'
  }
  return await dynamodb.update(params).promise().then((response) => {
    const body = {
      Message: 'PRODUTO ATUALIZADO COM SUCESSO!',
      UpdatedAttributes: response
    }
    return build.buildResponse(200, body);
  }, (error) => {
    console.error(error);
  })
}

async function deleteProduct(productId) {
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'productId': productId
    },
    ReturnValues: 'ALL_OLD'
  }
  return await dynamodb.delete(params).promise().then((response) => {
    const body = {
      Message: 'PRODUTO EXCLUÍDO COM SUCESSO ',
      Item: response
    }
    return build.buildResponse(200, body);
  }, (error) => {
    console.error(error);
  })
}

