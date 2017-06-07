/**
 Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
 http://aws.amazon.com/apache2.0/
 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';
var textHelper = (function () {


    return {
        completeHelp: 'Here\'s some things you can say,'
        + ' add john.'
        + ' give john 5 dollars.'
        + ' tell me the amount'
        + ' reset.'
        + ' and exit.',
        nextHelp: 'You can give a user dollars, add a player, get the current amount, or say help. What would you like?',

        getUserName: function (recognizedUserName) {
            if (!recognizedUserName) {
                return undefined;
            }
            var split = recognizedUserName.indexOf(' '), newName;

            if (split < 0) {
                newName = recognizedUserName;
            } else {
                //the name should only contain a first name, so ignore the second part if any
                newName = recognizedUserName.substring(0, split);
            }
            return newName;
        }
    };
})();
module.exports = textHelper;