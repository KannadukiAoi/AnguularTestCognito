import { Component } from '@angular/core';
import { AuthenticationDetails, CognitoUser, CognitoUserPool, CognitoUserAttribute, CognitoUserSession } from "amazon-cognito-identity-js";
import * as AWS from "aws-sdk";
import * as CognitoIdentity from "aws-sdk/clients/cognitoidentity";
import { CognitoIdentityCredentials } from 'aws-sdk/lib/credentials/cognito_identity_credentials';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'AnguularTestCognito';

  private AWS: any = AWS;

  private config = {
    Region: 'us-east-1',
    UserPoolId: 'us-east-1_ijqm9ldVY',
    IdentityPoolId: 'us-east-1:3ba55f7f-bcca-4557-b312-37fa50a404e0',
    AppID: '2pmgnaaqjrgojd73ckc4tep5lg',
    UserName: 'hiyuch@gmail.com',
    password: 'K10sk@2017',
    IoTCorePolicyName: 'TestPoi', //The policy name in IoT Core
    IdentityId: 'us-east-1:883806e6-349c-479f-9089-0edd737ad867', // AWS　→　Service　→　Cognito → Mange Identity Pools →　{Identity name} → Identity browser → {Identity ID},    
    IoTCoreEndpoint: 'a1pjk0rez75qhn.iot.us-east-1.amazonaws.com'
  }

  private iotTopic: string = "testTopic";


  setCredentialToAwsApi() {
    console.log('setCredentialToAwsApi()');

    var poolData = {
      UserPoolId: this.config.UserPoolId,
      ClientId: this.config.AppID // Your client id here
    };
    var userPool = new CognitoUserPool(poolData);

    let authenticationData = {
      Username: this.config.UserName,
      Password: this.config.password,
    };
    let userData = {
      Username: this.config.UserName,
      Pool: userPool
    };

    let authenticationDetails = new AuthenticationDetails(authenticationData);
    let cognitoUser = new CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        console.log('Success got token');
        //console.log(result);
        let idToken = result.getIdToken().getJwtToken();
        let accessToken = result.getAccessToken().getJwtToken();
        let refreshToken = result.getRefreshToken();

        AWS.config.region = this.config.Region;
        
        //type script way
        //let url = 'cognito-idp.' + this.config.Region + '.amazonaws.com/' + this.config.UserPoolId;
        // let logins: CognitoIdentity.LoginsMap = {};
        // logins[url] = idToken; //set the id token
        // let params: CognitoIdentityCredentials.CognitoIdentityOptions = {
        //   IdentityPoolId: this.config.IdentityPoolId,
        //   Logins: logins
        // };        
        // AWS.config.credentials = new AWS.CognitoIdentityCredentials(params, {});        

        //javascript way
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: this.config.IdentityPoolId,
          Logins: {
            'cognito-idp.us-east-1.amazonaws.com/us-east-1_ijqm9ldVY': idToken
          }         
        });
      },
      onFailure: (err) => {
        console.log('OnFailure');
        console.log(err);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        console.log('newPasswordRequired');
        console.log('userAttributes:');
        console.log(userAttributes);
        console.log('requiredAttributes:');
        console.log(requiredAttributes);

        //delete userAttributes.email_verified;
        //delete requiredAttributes.email_verified
        cognitoUser.completeNewPasswordChallenge(this.config.password, requiredAttributes, {
          onSuccess: result => {
            console.log("newPasswordRequired OnSuccess:");
            console.log(result);
          },
          onFailure: err => {
            console.log("newPasswordRequired err:");
            console.log(err);
          }

        });
      },
    });
  }

  listDynamoDb() {
    var ddb = new AWS.DynamoDB({ region: 'us-east-1' });
    ddb.listTables(function (err, data) {
      if (err) console.log(err);
      else console.log(data);
    });
  }

  attachPolicyToIoTCore() {
    var params = {
      policyName: this.config.IoTCorePolicyName,
      principal: this.config.IdentityId
    };
    var iot = new AWS.Iot();
    iot.attachPrincipalPolicy(params, (err, data) => {
      if (err) {
        console.log('attachPrincipalPolicy error:');
        console.log(err);
      } else {
        console.log('attachPrincipalPolicy succeed:');
      }
    });
  }

  publishTestData() {
    var iotdata = new AWS.IotData({ endpoint: this.config.IoTCoreEndpoint });

    iotdata.publish({
      topic: this.iotTopic,
      payload: '{"message":"Hello this is from Angular!"}',
      qos: 0
    }, (err, data) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log(data);
      }
    });
  }

}
