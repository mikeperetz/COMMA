/**
 Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
 http://aws.amazon.com/apache2.0/
 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
/**
 this is a test by ian testing github
 */

"use strict";
var textHelper = require("./textHelper"),
    storage = require("./storage");
var http = require("http");

//var amazon = require("./node_modules/amazon-product-api");

var registerIntentHandlers = function (intentHandlers, skillContext) {

    var API_key = "7bfcbb288a7d3007846797ef4c837399";

    var Access_Key_ID = "AKIAJBQWG22FBRKPTMOA";
    var Secret_Access_Key = "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";
    var Associate_Tag = "kim0c-20";


    //var generateQueryString = require('./node_modules/amazon-product-api/lib/utils').generateQueryString;


    var default_options = {
        hostname: "api.reimaginebanking.com",
        port: 80,
        //method: "POST",
        //path: "/customers?key=0201572d47af08b2774580bca34442b8",
        headers: {
            "content-type": "application/json"
        }
    };

    var default_amazon_options = {
        //http://webservices.amazon.com/onca/xml?AWSAccessKeyId=AKIAJBQWG22FBRKPTMOA&AssociateTag=kim0c-20&Keywords=xbox%20360&Operation=ItemSearch&ResponseGroup=Offers&SearchIndex=All&Service=AWSECommerceService&Timestamp=2016-08-01T23%3A32%3A53.000Z&Signature=pa1kvf%2BW3AK8ewWBXfLaN%2BjH67GRiYs8ZFEhmIpaBZ0%3D
        //http://api.reimaginebanking.com/customers?key=0201572d47af08b2774580bca34442b8
        hostname: "webservices.amazon.com",
        //hostname: "api.reimaginebanking.com",
        port: 443,
        //port: 80,
        //path: "",
        //path: "/customers?key=0201572d47af08b2774580bca34442b8",
        method: "ItemSearch",

        credentials: {
            awsId: Access_Key_ID,
            awsSecret: Secret_Access_Key,
            awsTag: Associate_Tag
        }
    };

    /* var amazonClient = amazon.createClient({
     awsId: Access_Key_ID,
     awsSecret: Secret_Access_Key,
     awsTag: Associate_Tag
     });*/

    var capitalize = {
        "credit card": "Credit Card",
        "savings": "Savings",
        "checking": "Checking"
    };

    var squish = {
        "Credit Card": "CreditCard",
        "Savings": "Savings",
        "Checking": "Checking"
    };


    var nessie_API = function (methodType, path_URL, args, callback, intent, session, response) {
        var options = default_options;
        options["method"] = methodType;
        options["path"] = path_URL;

        var request = http.request(options, function (result) {
            result.setEncoding("UTF-8");

            var resultBody = "";
            result.on("data", function (chunk) {
                resultBody += chunk;
            });

            result.on("end", function () {
                console.log(resultBody);
                //return callback(resultBody, intent, session, response);
                return callback(JSON.parse(resultBody), intent, session, response);
            });
        });

        request.on("error", function (error) {
            console.log("problem with request: " + error.message);
        });

        if (args !== null) {
            request.write(JSON.stringify(args), "utf8");
        }

        request.end();
    };


    var amazon_API = function (query, callback, intent, session, response) {

        var options = default_amazon_options;

        var url = generateQueryString(query, options.method, options.credentials);

        var request = http.request(url, function (res) {

            res.setEncoding("UTF-8");
            var responsebody = {};

            var tempPrice = "", tempTitle = "";

            var tempxml = "";

            //TODO: Calling lots and lots of times for some reason
            res.on("data", function (chunk) {
                //  console.log(chunk);
                tempxml += chunk;
                // console.log(tempxml);


            });

            res.on("end", function () {
                //get price
                var firstIndex = tempxml.indexOf("<Amount>") + 8;

                for (var i = firstIndex; tempxml.charAt(i) !== '<'; i++) {
                    tempPrice += tempxml.charAt(i);
                }

                responsebody["price"] = Math.floor(parseFloat(tempPrice)) / 100.0;

                //get title
                firstIndex = tempxml.indexOf("<Title>") + 7;

                for (var i = firstIndex; tempxml.charAt(i) !== '<'; i++) {
                    tempTitle += tempxml.charAt(i);
                }

                responsebody["title"] = tempTitle;

                console.log(responsebody.price); //199.33, for example
                console.log(responsebody.title); //199.33, for example

                console.log("done");
                return callback(responsebody, intent, session, response);
            });

        });

        request.on("error", function (error) {
            console.log("problem with request: " + error.message);
        });
        request.end();
    };


    intentHandlers.AuthenticateIntent = function(intent, session, response){

        // if (intent.slots.Code.value == "new code"){
        //         code = "temp";
        //         sesssion.attributes.code = code;
        //         response.askWithCard("I have sent a new code word to your alexa app. Please speak it aloud.", "Please say the code I sent to your alexa app", "Code:", code);
        // }

        // if (intent.slots.Code.value != session.attributes.code){
        //     response.ask("That's incorrect. Please try again. If you would like a new code, say, new code.", "Please try again. If you would like a new code, say, new code");

        // }

        response.ask("Lit. What would you like to do now?", "What would you like to do?");

    }


    //TODO: Numbers are too big. Manually edit to show off
    /**
     * When user says their name, will save them in the session (maybe loads them in the db? idk. Doesn't matter)
     * @param intent: whatever the user said. "Something something <name> something".
     * @param session: doesn't matter here, because we replace the session
     * @param response: the callback function
     * TODO: Pull data from nessie and put it into dynamo if not already updated
     * TODO: "there have been changes since we last spoke"
     * @constructor
     */
    intentHandlers.ValidateIntent = function (intent, session, response) {

        console.log("In Validate Intent");

        //Determines the current User Name
        var newUserName = textHelper.getUserName(intent.slots.UserName.value).toLowerCase();
        if (!newUserName) {
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        if (session.attributes.currUserName != undefined) {
            response.ask("I didn't catch that. What would you like to do?", "What would you like to do?");
        }
        session.attributes.currUserName = newUserName;

        storage.loadUser(session, function (currentUser) {

            if (currentUser.data.id == "0") {//then create a new customer

                

                var args = {
                    "first_name": newUserName,
                    "last_name": "Lit",
                    "address": {
                        "street_number": "90",
                        "street_name": "Springfield",
                        "city": "Richmond",
                        "state": "VA",
                        "zip": "60803"
                    }
                };
                nessie_API("POST", "/customers?key=" + API_key, args, function (resultBody, intent, session, response) {
                    session.attributes.currentUser.id = resultBody.objectCreated._id;
                    currentUser.data.id = session.attributes.currentUser.id;
                    session.attributes.pendingCheckingBalance = 0;
                    session.attributes.pendingSavingsBalance = 0;
                    session.attributes.pendingCreditCardBalance = 0;

                    currentUser.save(function () {
                       response.askWithCard("Nice to meet you, " + session.attributes.currUserName + "! You are now registered in my system. Let's confirm your identity. Please say the code I just sent to your alexa app.", "Please say the code I just sent to your alexa app.", "Code:", "covfefe");
                    });
                }, intent, session, response);
            }
            else {//then load an old customer
                //nessie_API("GET", "/customers/" + currentUser.data.id + "?key=" + API_key, null, function (resultBody, intent, session, response) {
                setPendingCheckingBalance(currentUser, function (currentUser, resultBody, intent, session, response) {
                    setPendingSavingsBalance(currentUser, function (currentUser, resultBody, intent, session, response) {
                        setPendingCreditCardBalance(currentUser, function (currentUser, resultBody, intent, session, response) {
                            //currentUser.save(function() {
                            var code = "covfefe";
                            session.attributes.code = code;
                            response.askWithCard("Welcome back, " + session.attributes.currUserName + "! Let's confirm your identity. Please say the code I just sent to your alexa app.", "Please say the code I just sent to your alexa app.", "Code:", code);
                            
                            //});
                        }, intent, session, response);
                    }, intent, session, response);
                }, intent, session, response);
            }
        })
    };


    /**
     * @param intent
     * @param session
     * @param response
     * @constructor
     */
    intentHandlers.AddAccountIntent = function (intent, session, response) {

        console.log("In Add Account Intent");

        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        var newAccountType = intent.slots.AccountType.value;

        if (!newAccountType) {
            response.ask("You can add either a Credit Card, Savings, or Checking account. Which would you like? ", "Which account type would you like? ");
        }

        storage.loadUser(session, function (currentUser) {
            var speechOutput,
                reprompt;


            newAccountType = capitalize[newAccountType];

            if (currentUser.data.accounts[newAccountType] !== "0") {//then tell user it exists already
                speechOutput = newAccountType + " is already stored with me. Anything else?";

                response.ask(speechOutput, " . ");

            }

            var creditCardMult = (newAccountType == "Credit Card") ? 0.1 : 1;
            var checkingMult = (newAccountType == "Checking") ? 0.5 : 1;

            //Else then create a new account
            var newBalance;
            if (newAccountType == "Credit Card")
                newBalance = 300.00;
            else if (newAccountType == "Checking")
                newBalance = 200.00;
            else
                newBalance = 500.00;

            //Math.floor(Math.random() * 25000 * 100 * creditCardMult * checkingMult) / 100;

            console.log(newBalance);

            var args = {
                "type": newAccountType,
                "nickname": newAccountType,
                "rewards": Math.floor(54604),
                "balance": newBalance,
                "account_number": "0000000000000000"
            };

            session.attributes["pending" + squish[newAccountType] + "Balance"] = newBalance;

            nessie_API("POST", "/customers/" + session.attributes.currentUser.id + "/accounts?key=" + API_key, args, function (resultBody, intent, session, response) {
                currentUser.data.accounts[newAccountType] = resultBody.objectCreated._id;

                speechOutput = newAccountType + " has been added. ";

                speechOutput += "Anything else?";
                reprompt = "Anything else?";

                currentUser.save(function () {
                    response.ask(speechOutput, " .");
                });
            }, intent, session, response);
        });
    };

    var monthEnds = {
        January: 31,
        February: 28,
        March: 31,
        April: 30,
        May: 31,
        June: 30,
        July: 31,
        August: 31,
        September: 30,
        October: 31,
        November: 30,
        December: 31
    };

    //array of month nums
    var monthNumEnds = [
        31, // (new Date().getMonth())
        28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31 //11
    ];

    var dateify = {
        "end": "end",
        "end of month": "end",
        "end of the month": "end",
        "every month": "end",
        "each month": "end",
        "monthly": "end",
        "1st": 1,
        "2nd": 2,
        "3rd": 3,
        "4th": 4,
        "5th": 5,
        "6th": 6,
        "7th": 7,
        "8th": 8,
        "9th": 9,
        "10th": 10,
        "11th": 11,
        "12th": 12,
        "13th": 13,
        "14th": 14,
        "15th": 15,
        "16th": 16,
        "17th": 17,
        "18th": 18,
        "19th": 19,
        "20th": 20,
        "21st": 21,
        "22nd": 22,
        "23nd": 23,
        "24th": 24,
        "25th": 25,
        "26th": 26,
        "27th": 27,
        "28th": 28,
        "29th": 29,
        "30th": 30,
        "31st": 31
    };

    /**
     * TODO: Incomes
     * @param intent
     * @param session
     * @param response
     * @constructor
     */
    intentHandlers.AddBillIntent = function (intent, session, response) {

        console.log("In Add Bill Intent");

        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        var newBillName, newBillDate, newBillDateFull, newBillAmount;


        newBillName = intent.slots.BillType.value;

        if (!newBillName) {
            response.ask("I didn't hear the name of your bill. Can you repeat that, please? ", " . ");
        }

        newBillDateFull = intent.slots.Date.value;

        if (!newBillDate) {
            response.ask("I didn't hear the due date of your bill. Can you repeat that, please? ", " . ");
        }

        newBillDate = dateify[newBillDateFull];

        if (newBillDate === undefined) {
            response.ask("I didn't understand the due date of your bill. Can you repeat that, please? ", " . ");
        }

        newBillAmount = intent.slots.Amount.value;

        if (!newBillAmount) {
            response.ask("I didn't hear the amount of your bill. Can you repeat that, please? ", " . ");
        }


        var currMonthEnd = monthNumEnds[new Date().getMonth()];

        if (isNaN(parseInt(newBillDate))) {
            // need to find what they said ("end of month, etc.").
            // Only "end of month" for now, or assumes they mean end of month in general
            newBillDate = "" + currMonthEnd; //the last day of the current month
        }

        else if (newBillDate < 1 || newBillDate > currMonthEnd) {
            response.ask("That's not a valid date. Can you repeat that, please? ", " . ");
        }
        newBillDate = newBillDate + "";


        storage.loadUser(session, function (currentUser) {
            var speechOutput,
                reprompt;
            if (currentUser.data.billBalances[newBillName] !== undefined) {
                speechOutput = newBillName + " already exists. In a future update, you can replace, modify, or duplicate it.";

                response.ask(speechOutput + " Anything else?", " . ");
            }
            speechOutput = "Your " + newBillName + " for " + newBillAmount + " due on the " + newBillDate + " of each month has been added.";
            currentUser.data.bills.push(newBillName);
            currentUser.data.billBalances[newBillName] = newBillAmount;
            currentUser.data.billDates[newBillName] = newBillDate;
            currentUser.save(function () {
                response.ask(speechOutput, " . ");
            });
        });
    };

    /* TODO: Yes/no intents

     * Simulate a speech tree
     * @param intent
     * @param session
     * @param response
     * @constructor

     intentHandlers.YesIntent = function (intent, session, response) {

     //read session.attributes.context for context
     };

     intentHandlers.NoIntent = function (intent, session, response) {

     };*/

    /**
     * TODO: Maybe add pounds conversion lel?
     * @param intent
     * @param session
     * @param response
     * @constructor
     */
    intentHandlers.DepositIntent = function (intent, session, response) {

        console.log("In Deposit Intent");

        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        //give a source amounts, ask additional question if slot values are missing.
        var accountType = intent.slots.AccountType.value,
            amountObj = intent.slots.Amount,
            amount;
        /* if (!source) {
         response.ask("sorry, I did not hear the source name, please say that again", "Please say the source name again");

         }*/

        if (!accountType) {
            response.ask("Please specify the account type or create an account if you have not done so already. ", "please say the command again");
        }

        if (accountType == "Credit Card") {
            response.ask("You cannot deposit to a Credit Card.", "What else can I help you with? ");
        }

        if (!amountObj) {
            response.ask("sorry, I did not hear the amount, please say that again", "please say the amount again")
        }

        amount = parseInt(amountObj.value);
        if (isNaN(amount)) {
            console.log("Invalid balance value = " + amountObj.value);
            response.ask("sorry, I did not hear the amount, please say that again", "please say the amount again");
        }


        storage.loadUser(session, function (currentUser) {
            if (currentUser.data.accounts[capitalize[accountType]] == "0") {
                response.ask("sorry, you don't have a " + accountType + " account. If you would like to open one, say, open a " + accountType + " account.", "what can I do for you?");
            }

            nessie_API("GET", "/accounts/" + currentUser.data.accounts[capitalize[accountType]] + "?key=" + API_key, null, function (resultBody, intent, session, response) {
                var oldBalance = resultBody.balance;

                oldBalance = Math.floor(oldBalance * 100) / 100.0;
                var args = {
                    "medium": "balance",
                    "transaction_date": getDateString(),
                    "description": "string",
                    "amount": amount
                };

                session.attributes["pending" + capitalize[accountType] + "Balance"] = Math.floor(session.attributes["pending" + capitalize[accountType] + "Balance"] * 100) / 100;

                nessie_API("POST", "/accounts/" + currentUser.data.accounts[capitalize[accountType]] + "/deposits?key=" + API_key, args, function (resultBody, intent, session, response) {
                    session.attributes["pending" + capitalize[accountType] + "Balance"] += amount;
                    var newBalance = session.attributes["pending" + capitalize[accountType] + "Balance"];
                    response.ask("Deposit pending. You have $" + oldBalance + ", but you will have $" + newBalance + " in your account upon execution. ", " . ");
                }, intent, session, response);
            }, intent, session, response);
        });
    };

    /**
     * @param intent
     * @param session
     * @param response
     * @constructor
     */
    intentHandlers.WithdrawIntent = function (intent, session, response) {

        console.log("In Withdraw Intent");

        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        //give a source amounts, ask additional question if slot values are missing.
        var accountType = intent.slots.AccountType.value,
            amountObj = intent.slots.Amount,
            amount;
        /* if (!source) {
         response.ask("sorry, I did not hear the source name, please say that again", "Please say the source name again");

         }*/

        if (!accountType) {
            response.ask("Please specify the account type or create an account if you have not done so already. ", "please say the command again");
        }

        if (accountType == "Credit Card") {
            response.ask("You cannot withdraw from a Credit Card.", "What else can I help you with? ");
        }

        if (!amountObj) {
            response.ask("sorry, I did not hear the amount, please say that again", "please say the amount again")
        }

        amount = parseInt(amountObj.value);
        if (isNaN(amount)) {
            console.log("Invalid balance value = " + amountObj.value);
            response.ask("sorry, I did not hear the amount, please say that again", "please say the amount again");

        }

        storage.loadUser(session, function (currentUser) {
            if (currentUser.data.accounts[capitalize[accountType]] == "0") {
                response.ask("sorry, you don't have a " + accountType + " account. If you would like to open one, say, open a " + accountType + " account.", "what can I do for you?");
            }

            nessie_API("GET", "/accounts/" + currentUser.data.accounts[capitalize[accountType]] + "?key=" + API_key, null, function (resultBody, intent, session, response) {
                var oldBalance = resultBody.balance;

                oldBalance = Math.floor(oldBalance * 100) / 100.0;


                var args = {
                    "medium": "balance",
                    "transaction_date": getDateString(),
                    "description": "string",
                    "amount": amount
                };

                session.attributes["pending" + capitalize[accountType] + "Balance"] = Math.floor(session.attributes["pending" + capitalize[accountType] + "Balance"] * 100) / 100;


                nessie_API("POST", "/accounts/" + currentUser.data.accounts[capitalize[accountType]] + "/withdrawals?key=" + API_key, args, function (resultBody, intent, session, response) {
                    session.attributes["pending" + capitalize[accountType] + "Balance"] -= amount;
                    var newBalance = session.attributes["pending" + capitalize[accountType] + "Balance"];
                    newBalance = Math.floor(newBalance * 100) / 100.0;
                    if (newBalance >= 0) {
                        response.ask("Withdrawal pending. You have $" + oldBalance + ", but you will have $" + newBalance + " in your account upon execution. ", " . ");
                    } else {
                        response.ask("Withdrawal is beyond your balance. You have $" + oldBalance + ", but you would have $" + newBalance + " in your account. ", " . ");
                    }
                }, intent, session, response);
            }, intent, session, response);
        });
    };

    /**
     * @param intent
     * @param session
     * @param response
     * @constructor
     */
    intentHandlers.TellBalancesIntent = function (intent, session, response) {
        //tells the balances in the overview and send the result in card.

        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        storage.loadUser(session, function (currentUser) {

            session.attributes.pendingCheckingBalance = Math.floor(session.attributes.pendingCheckingBalance * 100) / 100;
            session.attributes.pendingSavingsBalance = Math.floor(session.attributes.pendingSavingsBalance * 100) / 100;

            session.attributes.pendingCreditCardBalance = Math.floor(session.attributes.pendingCreditCardBalance * 100) / 100;


            var speechOutput = "";
            if (currentUser.data.accounts.Checking != "0") {
                speechOutput += "You have $" + session.attributes.pendingCheckingBalance + " in your checking account. "
            }
            if (currentUser.data.accounts.Savings != "0") {
                speechOutput += "You have $" + session.attributes.pendingSavingsBalance + " in your savings account. "
            }
            if (currentUser.data.accounts["Credit Card"] != "0") {
                speechOutput += "You have $" + session.attributes.pendingCreditCardBalance + " left to pay off in your credit card account. "
            }
            response.ask(speechOutput + "What would you like to do now?", "What would you like to do?");

        });
    };

    /**
     * TODO: Precursor to "Can I afford". Find the current net amount of money atm
     * @param intent
     * @param session
     * @param response
     * @constructor
     */
    intentHandlers.TellTotalIntent = function (intent, session, response) {
        // give balance minus the bill balances
        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        var date = new Date();
        var year = date.getFullYear();
        var month = ("00" + (date.getMonth() + 1)).slice(-2)
        var day = parseInt(("00" + date.getDate()).slice(-2));

        var time;
        if (intent.slots.Scope.value === "paycheck")
            time = "paycheck";
        else
            time = "month";

        storage.loadUser(session, function (currentUser) {

            var total = session.attributes.pendingCheckingBalance + session.attributes.pendingSavingsBalance - session.attributes.pendingCreditCardBalance;

            console.log(total);
            if (time == "month") {
                for (var b = 0; b < currentUser.data.bills.length; b++) {
                    if (currentUser.data.billDates[currentUser.data.bills[b]] > day)
                        total -= currentUser.data.billBalances[currentUser.data.bills[b]];
                }
                total = Math.floor(total * 100) / 100.0;
                response.ask("You will have $" + total + " to spend at the end of the month, accounting for bills. Anything else?", ". ");
            } else {
                for (var b = 0; b < currentUser.data.bills.length; b++) {
                    var billDate = currentUser.data.billDates[currentUser.data.bills[b]];
                    if (billDate >= day && (day >= 15 || billDate < 15)) {
                        total -= currentUser.data.billBalances[currentUser.data.bills[b]];
                    }
                }
                total = Math.floor(total * 100) / 100.0;

                response.ask("You will have $" + total + " to spend by your next paycheck, accounting for bills. Anything else?", ". ");

            }


        });
    };

    /**
     * TODO: send links to other items via phone app
     */
    intentHandlers.CanIAffordIntent = function (intent, session, response) {


        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", ". ");
        }

        var date = new Date();
        var day = parseInt(("00" + date.getDate()).slice(-2));


        var product = intent.slots.Product.value; //name of item from amazon

        //todo: grab keyword from intent
        var query = {
            searchIndex: 'All',
            keywords: product,
            responseGroup: 'ItemAttributes,Offers'
        };

        /*
            IN CASE DNYAMO SCREWS UP
         {\"id\":\"57a3c559f720c9635f57ec2b\",\"bills\":[\"electric bill\",\"insurance\",\"mortgage\"],\"billBalances\":{\"electric bill\":\"60\",\"insurance\":\"100\",\"mortgage\":\"200\"},\"billDates\":{\"electric bill\":\"31\",\"insurance\":\"17\",\"mortgage\":\"10\"},\"accounts\":{\"Credit Card\":\"0\",\"Checking\":\"57a3c560f720c9635f57ec2c\",\"Savings\":\"57a3c566f720c9635f57ec2d\"}}
         */


        storage.loadUser(session, function (currentUser) {
            amazon_API(query, function (resultBody, intent, session, response) {
                var price = resultBody.price; //e.g. 199.43
                var title = resultBody.title;

                session.attributes.pendingCheckingBalance = Math.floor(session.attributes.pendingCheckingBalance * 100) / 100;
                session.attributes.pendingSavingsBalance = Math.floor(session.attributes.pendingSavingsBalance * 100) / 100;
                session.attributes.pendingCreditCardBalance = Math.floor(session.attributes.pendingCreditCardBalance * 100) / 100;

                var total = session.attributes.pendingCheckingBalance + session.attributes.pendingSavingsBalance - session.attributes.pendingCreditCardBalance;
                for (var b = 0; b < currentUser.data.bills.length; b++) {
                    var billDate = currentUser.data.billDates[currentUser.data.bills[b]];
                    if (billDate >= day && (day >= 15 || billDate < 15)) {
                        total -= currentUser.data.billBalances[currentUser.data.bills[b]];
                    }
                }

                var net = total - price;

                net = Math.floor(net * 100) / 100.0;


                var speechOutput = "The best match that I can find is " + title + " selling for $" + price + ". This will leave you about $" + net + " left to spend by your next paycheck accounting for bills. So, ";

                if (price > total)
                    speechOutput += "I'm sorry, but you simply cannot afford it. ";
                else {
                    if (total - price < 40)
                        speechOutput += "you can technically afford it, but you will be quite low on funds. I have sent a list of potentially cheaper alternatives that your son may enjoy to your Alexa app. ";
                    else
                        speechOutput += "you can definitely afford it! I have added it to your Amazon Cart. ";
                }

                speechOutput += "Anything else?";

                response.ask(speechOutput, ". ");

            }, intent, session, response);

        });
    };


    intentHandlers.TellRewardsIntent = function (intent, session, response) {
        //tells the exact rewards amount
        console.log("Rewards balance intent");
        var accountType = "Credit Card";

        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        storage.loadUser(session, function (currentUser) {
            if (currentUser.data.accounts[accountType] === "0") {
                response.ask("It appears that you don't have a credit card account yet. You must open one first. Anything else?", " . "); //no card yet

            }
            nessie_API("GET", "/accounts/" + currentUser.data.accounts[accountType] + "?key=" + API_key, null, function (resultBody, intent, session, response) {
                var rewardsBalance = resultBody.rewards;

                response.ask("You currently have " + rewardsBalance + " Capital One Rewards Miles. Anything else?", " . ");

            }, intent, session, response);
        });
    };

    /**
     * TODO: Finish this. Include specific prizes they can redeem for
     * @param intent
     * @param session
     * @param response
     * @constructor
     */




    intentHandlers.TellRewardsOptionsIntent = function (intent, session, response) {
        console.log("Reward options intent");
        var accountType = 'Credit Card';
        storage.loadUser(session, function (currentUser) {
            if (currentUser.data.accounts[accountType] === "0") {
                response.ask('It appears that you don\'t have a credit card account yet. You must open one first. Anything else?', 'Anything else?'); //no card yet
                return;
            }
            nessie_API("GET", "/accounts/" + currentUser.data.accounts[accountType] + "?key=" + API_key, null, function (resultBody, intent, session, response) {
                var rewardsBalance = resultBody.rewards;
                var travelRedemption = Math.floor(rewardsBalance * .01);
                var cashbackRedemption = Math.floor(rewardsBalance * .0075);
                if (rewardsBalance < 15000) {
                    response.ask("Sorry, " + session.attributes.currUserName + " your rewards balance of " + rewardsBalance + " does not meet the minimum redemption level.", 'Anything else?');
                    return;
                }
                var travelPackage = "nothing";
                if (rewardsBalance < 15000) {
                    travelPackage = "nothing";
                }
                else if (rewardsBalance >= 15000 && rewardsBalance < 35000) {
                    travelPackage = " round trip airfare from Chicago to New York City, or Los Angeles";
                }
                else if (rewardsBalance >= 35000 && rewardsBalance < 60000) {
                    travelPackage = " round trip airfare from Chicago to Cancun and a three night stay in Cancun Luxury Resorts";
                }
                else if (rewardsBalance >= 60000 && rewardsBalance < 100000) {
                    travelPackage = " round trip airfare from Chicago to Miami, a five night stay in Marriot's Stanton South Beach four start hotel, and an air boat tour of the everglades."
                }
                else if (rewardsBalance >= 100000 && rewardsBalance < 200000) {
                    travelPackage = " round trip airfare from Chicago to London."
                }
                else if (rewardsBalance >= 200000 && rewardsBalance < 300000) {
                    travelPackage = " round trip airfare from Chicago to Paris and a five night stay in Hilton Paris Opera's four star hotel."
                }
                response.ask("Congrats " + session.attributes.currUserName + "!! Your Capital One Rewards balance of " + rewardsBalance + " miles can be redeemed for up to $" + travelRedemption + " in travel; or $" + cashbackRedemption + " in cash back. Just for fun, that translates into" + travelPackage + ". Anything else?", ". "); //TODO
            }, intent, session, response);
        });
    };


    /**
     * TODO: haven't tested this yet. Maybe as a helper function instead?
     * @param intent
     * @param session
     * @param response
     * @constructor
     */
    intentHandlers.TellMinimumPaymentIntent = function (intent, session, response) {
        console.log("MinimumBalanceIntent");

        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        var accountType = "Credit Card";
        storage.loadUser(session, function (currentUser) {
            if (currentUser.data.accounts[accountType] === "0") {
                response.ask("It appears that you don't have a credit card account yet. You must open one first. Anything else?", " . "); //no card yet

            }
            nessie_API("GET", "/accounts/" + currentUser.data.accounts[accountType] + "?key=" + API_key, null, function (resultBody, intent, session, response) {
                var cardBalance = resultBody.balance;
                var threePercentBalance = cardBalance * .03;
                var minPayment = Math.floor(threePercentBalance);
                if (threePercentBalance < 15) {
                    minPayment = 15;
                }

                response.ask("This bill cycle, the minimum payment due on your credit card is $" + minPayment + " . Anything else?", " . ");
            }, intent, session, response);

        });
    };
 
    /**
     * TODO: Finish this method
     * @param intent
     * @param session
     * @param response
     * @constructor
     */
    intentHandlers.TellDebtIntent = function (intent, session, response) {
        console.log("TellDebtIntent");
        if (session.attributes.currentUser.id == "0") {
            response.ask("I'm sorry, Who am I speaking with?", " . ");
        }
        var cardAccount = "Credit Card";
        var checkingAccount = "Checking";
        storage.loadUser(session, function (currentUser) {
            if (currentUser.data.accounts[cardAccount] === "0") {
                response.ask("It appears that you don't have a credit card account yet. You must open one first. Anything else?", " . ");
            }
            var debt =  session.attributes.pendingCreditCardBalance - session.attributes.pendingCheckingBalance ;

            if (debt > 0) {
                response.ask("You have " + debt + " dollars in debt. Anything else?", " . ");
            } else {
                response.ask("Congratulations you are debt free. Anything else?", " . ");
            }
        });
    };

    /**
     * TODO: Make into something practical
     * @param intent
     * @param session
     * @param response
     * @constructor
     */
    intentHandlers.ResetBillsIntent = function (intent, session, response) {
        //remove all sources

        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        storage.newUser(session).save(function () {
            response.ask("Who am I speaking with?", "I didn't catch that. Who am I speaking to?");
        });
    };

    intentHandlers["AMAZON.HelpIntent"] = function (intent, session, response) {
        //var speechOutput = "You can do lots of things.";

        if (session.attributes.currentUser.id == "0") {//then create a new customer
            response.ask("I'm sorry. Who am I speaking with?", " . ");
        }

        response.ask("You can do lots of things." + " So, how can I help?", "How can I help?");

    };

    intentHandlers["AMAZON.CancelIntent"] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell("Goodbye");
        } else {
            response.tell("Goodbye");
        }
    };

    intentHandlers["AMAZON.StopIntent"] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell("Goodbye.");
        } else {
            response.tell("Goodbye");
        }
    };


    var getDateString = function () {
        var date = new Date();
        var year = date.getFullYear();
        var month = ("00" + (date.getMonth() + 1)).slice(-2)
        var day = ("00" + date.getDate()).slice(-2);
        var dateString = year + "-" + month + "-" + day;
        return dateString;
    };

    var setPendingCheckingBalance = function (currentUser, callback, intent, session, response) {
        if (currentUser.data.accounts.Checking != "0") {
            nessie_API("GET", "/accounts/" + currentUser.data.accounts.Checking + "?key=" + API_key, null, function (resultBody, intent, session, response) {
                session.attributes.pendingCheckingBalance = resultBody.balance;
                session.attributes.pendingCheckingBalance = Math.floor(session.attributes.pendingCheckingBalance * 100) / 100;
                session.attributes.pendingSavingsBalance = Math.floor(session.attributes.pendingSavingsBalance * 100) / 100;
                session.attributes.pendingCreditCardBalance = Math.floor(session.attributes.pendingCreditCardBalance * 100) / 100;
                return callback(currentUser, resultBody, intent, session, response);
            }, intent, session, response);
        } else {
            session.attributes.pendingCheckingBalance = 0;
            return callback(currentUser, null, intent, session, response);
        }
    };

    var setPendingSavingsBalance = function (currentUser, callback, intent, session, response) {
        if (currentUser.data.accounts.Savings != "0") {
            nessie_API("GET", "/accounts/" + currentUser.data.accounts.Savings + "?key=" + API_key, null, function (resultBody, intent, session, response) {
                session.attributes.pendingSavingsBalance = resultBody.balance;
                session.attributes.pendingCheckingBalance = Math.floor(session.attributes.pendingCheckingBalance * 100) / 100;
                session.attributes.pendingSavingsBalance = Math.floor(session.attributes.pendingSavingsBalance * 100) / 100;
                session.attributes.pendingCreditCardBalance = Math.floor(session.attributes.pendingCreditCardBalance * 100) / 100;
                return callback(currentUser, resultBody, intent, session, response);
            }, intent, session, response);
        } else {
            session.attributes.pendingSavingsBalance = 0;
            return callback(currentUser, null, intent, session, response);
        }
    };

    var setPendingCreditCardBalance = function (currentUser, callback, intent, session, response) {
        if (currentUser.data.accounts["Credit Card"] != "0") {
            nessie_API("GET", "/accounts/" + currentUser.data.accounts["Credit Card"] + "?key=" + API_key, null, function (resultBody, intent, session, response) {
                session.attributes.pendingCreditCardBalance = resultBody.balance;
                session.attributes.pendingCheckingBalance = Math.floor(session.attributes.pendingCheckingBalance * 100) / 100;
                session.attributes.pendingSavingsBalance = Math.floor(session.attributes.pendingSavingsBalance * 100) / 100;
                session.attributes.pendingCreditCardBalance = Math.floor(session.attributes.pendingCreditCardBalance * 100) / 100;
                return callback(currentUser, resultBody, intent, session, response);
            }, intent, session, response);
        } else {
            session.attributes.pendingCreditCardBalance = 0;
            return callback(currentUser, null, intent, session, response);
        }
    };
};
exports.register = registerIntentHandlers;
