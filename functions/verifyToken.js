const build = require('../exports/buildResponse');
const auth = require('../exports/auth');

function verify(requestBody) {
  if (!requestBody.user || !requestBody.user.username || !requestBody.token) {
    return build.buildResponse(401, { 
      verified: false,
      message: 'incorrect request body'
    })
  }

  const user = requestBody.user;
  const token = requestBody.token;
  const verification = auth.verifyToken(user.username, token);
  if (!verification.verified) {
    return build.buildResponse(401, verification);
  }

  return build.buildResponse(200, {
    verified: true,
    message: 'Tudo certo',
    user: user,
    token: token
  })
}

module.exports.verify = verify;