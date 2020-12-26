
var Wild = window.Wild || {};

(function scopeWrapper($) {
    var signinUrl = 'signin.html';

    var poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId
    };

    var userPool;

    if (!(_config.cognito.userPoolId &&
          _config.cognito.userPoolClientId &&
          _config.cognito.region)) {
        $('#noCognitoMessage').show();
        return;
    }

    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    Wild.signOut = function signOut() {
        userPool.getCurrentUser().signOut();
    };

    Wild.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            resolve(null);
        }
    });


    /*
     * Cognito User Pool functions
     */

    function register(email, password, onSuccess, onFailure) {
        var dataEmail = {
            Name: 'email',
            Value: email
        };
        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);

        userPool.signUp(email, password, [attributeEmail], null,
            function signUpCallback(err, result) {
                if (!err) {
                    onSuccess(result);
                } else {
                    onFailure(err);
                }
            }
        );
    }

    function signin(email, password, onSuccess, onFailure) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password
        });

        var cognitoUser = createCognitoUser(email);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: onSuccess,
            onFailure: onFailure
        });
    }

    function verify(email, code, onSuccess, onFailure) {
        createCognitoUser(email).confirmRegistration(code, true, function confirmCallback(err, result) {
            if (!err) {
                onSuccess(result);
            } else {
                onFailure(err);
            }
        });
    }

    function createCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: email,
            Pool: userPool
        });
    }

    function resetCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: email,
            Pool: userPool
        });
    }

    function forgotpasswordbutton(email,password) {
       
        var userData = {
            Username : email,
            Pool : userPool,
        };
        
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
            
        cognitoUser.forgotPassword({
            onSuccess: function (result) {
                window.location.href = 'signin.html';
               // console.log('call result: ' + result);
            },
            onFailure: function(err) {
                alert(err);
                console.log(err);
            },
            inputVerificationCode() {
                var verificationCode = prompt("Please Enter the verification code we sent to " + email + " , if you don't see it, Please check your email inbox or spam folder for your verification." ,'');
                if (verificationCode !== null) {
                     cognitoUser.confirmPassword(verificationCode, password, this);

                }
             }
        });
      }

    /*
     *  Event Handlers
     */

    $(function onDocReady() {
        $('#signinForm').submit(handleSignin);
        $('#registrationForm').submit(handleRegister);
        $('#verifyForm').submit(handleVerify);
        $('#resetForm').submit(handleReset);
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('verfiyemail'))   {
            $('#message-registration').show()


        }    
    });

    function handleReset(event) {
        var email = $('#emailInputReset').val();
        var password = $('#passwordInputReset').val();
        var password2 = $('#password2InputReset').val();

        var onSuccess = function resetSuccess(result) {
            console.log('Successfully Reset the Password');
            window.location.href = 'signin.html';
   
        };
        var onFailure = function tesetFailure(err) {
            alert(err);
        };
        event.preventDefault();

        if (password === password2) {
            forgotpasswordbutton(email, password, onSuccess, onFailure);
        } else {
            alert('Passwords do not match');
        }
    }
    

    function handleSignin(event) {
        var email = $('#emailInputSignin').val();
        var password = $('#passwordInputSignin').val();
        event.preventDefault();
        signin(email, password,
            function signinSuccess() {
                console.log('Successfully Logged In');
                window.location.href = 'ride.html';
            },
            function signinError(err) {
                alert(err);
            }
        );
    }

    function handleRegister(event) {
        var email = $('#emailInputRegister').val();
        var password = $('#passwordInputRegister').val();
        var password2 = $('#password2InputRegister').val();

        var onSuccess = function registerSuccess(result) {
            var cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());
            var confirmation = ('Registration successful. Please check your email inbox or spam folder for your verification.');
            if (confirmation) {
               // window.location.href = 'verify.html';
               
               //alert("Registration successful. Please check your email inbox or spam folder for your verification.")
               window.location.href = 'signin.html?verfiyemail=true';

            }
        };
        var onFailure = function registerFailure(err) {
            alert(err);
        };
        event.preventDefault();

        if (password === password2) {
            register(email, password, onSuccess, onFailure);
        } else {
            alert('Passwords do not match');
        }
    }

    function handleVerify(event) {
        var email = $('#emailInputVerify').val();
        var code = $('#codeInputVerify').val();
        event.preventDefault();
        verify(email, code,
            function verifySuccess(result) {
                console.log('call result: ' + result);
                console.log('Successfully verified');
                alert('Verification successful. You will now be redirected to the login page.');
                window.location.href = signinUrl;
            },
            function verifyError(err) {
                alert(err);
            }
        );
    }
}(jQuery));
