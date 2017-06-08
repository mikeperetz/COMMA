/**
 Copyright Capial One Financial Corp.

 */

'use strict';
var AWS = require("aws-sdk");
var TableName = 'COMMA';


var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


    /*
     * The User class stores all user states for the user
     */
    function User(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {
                id: "0",
                bills: [],         //name of bill
                billBalances: {},  //name: amount per month
                billDates: {},     //name: day of month
                accounts: {
                    "Credit Card": "0",
                    "Checking": "0",
                    "Savings": "0"
                },
                expenses : {
                    food: [],
                    entertainment: []
                }
            };
        }

        this._session = session;
    }

    User.prototype = {
        save: function (callback) {
            //save the user states in the session,
            //so next time we can save a read from dynamoDB
            this._session.attributes.currentUser = this.data;
            dynamodb.putItem({
                TableName: TableName,
                Item: {
                    User: {
                        S: this._session.attributes.currUserName
                    },
                    Data: {
                        S: JSON.stringify(this.data)
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {
        loadUser: function (session, callback) {
            if (session.attributes.currentUser) {
                console.log('get user from session=' + session.attributes.currentUser);
                callback(new User(session, session.attributes.currentUser));
                return;
            }
            dynamodb.getItem({
                TableName: TableName,
                Key: {
                    User: {
                        S: session.attributes.currUserName
                    }
                }
            }, function (err, data) {
                var currentUser;
                if (err) {
                    console.log(err, err.stack);
                    currentUser = new User(session);
                    session.attributes.currentUser = currentUser.data;
                    callback(currentUser);
                } else if (data.Item === undefined) {
                    currentUser = new User(session);
                    session.attributes.currentUser = currentUser.data;
                    callback(currentUser);
                } else {
                    console.log('get user from dynamodb=' + data.Item.Data.S);
                    currentUser = new User(session, JSON.parse(data.Item.Data.S));
                    session.attributes.currentUser = currentUser.data;
                    callback(currentUser);
                }
            });
        },
        newUser: function (session) {
            return new User(session);
        }
    };
})();
module.exports = storage;