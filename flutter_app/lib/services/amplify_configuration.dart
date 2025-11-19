// lib/amplifyconfiguration.dart
const amplifyconfig = '''{
  "auth": {
    "plugins": {
      "awsCognitoAuthPlugin": {
        "UserAgent": "aws-amplify-flutter/0.1.0",
        "Version": "1.0",
        "IdentityManager": {"Default": {}},
        "CognitoUserPool": {
          "Default": {
            "PoolId": "ap-southeast-2_JTbvLI75U",
            "AppClientId": "6oc0clesba0jp5idmok3huo0m6",
            "Region": "ap-southeast-2"
          }
        },
        "Auth": {
          "Default": {
            "authenticationFlowType": "USER_SRP_AUTH"
          }
        }
      }
    }
  }
}''';
