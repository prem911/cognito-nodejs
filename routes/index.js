var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var AWSCognito = require('amazon-cognito-identity-js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/emailsignin', function(req, res, next) {
    var email = req.body.email;
    var pwd = req.body.password;

    AWS.config.region = 'eu-west-1';
    var poolData = {
      UserPoolId : 'your-user-pool-id',
      ClientId : 'your-app-client-id'
    };
    var userPool = new AWS.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
    var authenticationData = {
      Username : email,
      Password : pwd,
    };
    var authenticationDetails = new AWS.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
    var userData = {
      Username : email,
      Pool : userPool
    };
    var cognitoUser = new AWS.CognitoIdentityServiceProvider.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        console.log('access token + ' + result.getAccessToken().getJwtToken());
        /*Use the idToken for Logins Map when Federating User Pools with Cognito Identity or when passing through an Authorization Header to an API Gateway Authorizer*/
        console.log('idToken + ' + result.idToken.jwtToken);
        userPoolToken = result.getIdToken().getJwtToken();
        console.log("userPoolToken = "+ userPoolToken);
        //We can take AWS.config.credentials from the session object for linking.
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: global_identityPoolId,
          Logins: {}
        });
        AWS.config.credentials.params.Logins['your-user-pool-arn'] = result.idToken.jwtToken;
        AWS.config.credentials.get((error) => {
          if (error) {
            console.log("## credentials.get: " + error);
            return res.status(error.statusCode).send({ success: false, message: error.message });
          }
          else{
            console.log(AWS.config.credentials.identityId);
            return res.status(200).send({ 
              success: true, 
              message: 'Logged in', 
              user: { 
                id: AWS.config.credentials.identityId
              }
            });
          }
        }); 
      },
      onFailure: function(err) {
        console.error(err);
        return res.status(err.statusCode).send({ success: false, message: err.message, error : err});
      }
    });
});


module.exports = router;
