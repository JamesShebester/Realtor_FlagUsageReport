import * as OptlyRest from "./api/optly-rest-toolkit.js";

//NOTE: This is initiating the constuctor for the Rest API tool calling.
let restAPI;

//NOTE: Main function call to start the Optimizely Flage Usage Report
async function OptimizelyUsageReport(personalToken, personalProject, includeArchived = false) {

    //NOTE: Build restAPI as the OptlyRestToolKit constructor using the passed in parameters (personalToken, personalProject). These are need to call into the API to pull data lists
    restAPI = new OptlyRest.OptlyRestToolkit({
        token: personalToken,
        projectId: personalProject,
    });

    //NOTE: Grab the features for a project.
    var features = await PullFeatures(includeArchived);

    //NOTE: Grab the audiences for a project
    var audiences = await PullAudiences(includeArchived);

    //NOTE: Grab the experiments for a project.
    var experiments = await PullExperiments(includeArchived);

    //NOTE: Create the Flag Usage Report using the Features and Experiments dictionaries
    var flagUsageReporting = await FlagUsageReporting(features, experiments, audiences);

    //NOTES: Final return object of of 3 arrays(Features in Experiments, Experiments, and Orphaned Features not attached to Experiments)
    return flagUsageReporting;

};


//NOTE: Builds a Dictionary of Features by ProjectId
//featureDictionary[featureId_environmentName]:Rollout_Rules_Array
//Example 15121561515_development:Array(2)
async function PullFeatures(includeArchived) {
    try {

        let featureName = "";

        //NOTE: Getting a list of all Features of a Project.
        let response = await restAPI.features('list');

        //NOTE: This is saying if the variable of includeArchived is false then it will filter them out of the restAPI Return object
        if (!includeArchived) {
            response = response.filter(item => item.archived === false);
        }

        //NOTE: New Dictionary for Features that I will be looping through and pulling data.
        let featureDictionary = {};

        //NOTE: Loop through each feature of the response Array.
        for (var i = 0; i < response.length; i++) {

            //NOTE: Parsing the Feature that is in JSON format from a JSON String.
            let parsedFeature = JSON.parse(JSON.stringify(response[i]));

            //NOTE: Grab the Feature ID to be used later to form the dictionary key with Environment
            featureName = parsedFeature["name"];

            //NOTE: Grab all environments from a Feature.
            let environmentArray = parsedFeature["environments"];

            //NOTE: Need the count of the environment keys
            let environmentCount = Object.keys(environmentArray).length;

            //NOTE: Loop through each environment.
            for (var j = 0; j < environmentCount; j++) {

                //NOTE: Grabbing the environment to use to make Dictionary Key.
                let environmentKeys = Object.keys(JSON.parse(JSON.stringify(environmentArray)));
                let environmentName = environmentKeys[j];

                //NOTE: Parse the JSON Environment Object
                let parsedEnvironments = JSON.parse(JSON.stringify(environmentArray));

                //TODO: Finish working on this pulling only 1 object at a time.
                let singleEnvironment = parsedEnvironments[environmentName];

                //NOTE: Gran the array of rollout_rules
                let rolloutRules = singleEnvironment["rollout_rules"];

                //NOTE: Add record to diction of the key of featureId_environmentName and the array of rollout_rules object.
                featureDictionary[featureName + '_' + environmentName] = rolloutRules;
            }

        }
        //NOTE: Return the Dictionary to be used by another function
        return featureDictionary;
    }
    catch (error) {
        console.log(error);
    }
}


//NOTE: Build a Dictionary of Experiments by Project_Id
async function PullExperiments(includeArchived) {
    try {

        //NOTE: Initialize the Dictionary for Experments
        let experimentsDictionary = {};
        //NOTE: Getting a list of all Experiments of a Project via API. 
        let experimentList = await restAPI.experiments('list');

        //NOTE: This is saying if the variable of includeArchived is false then it will filter them out of the restAPI Return object
        if (!includeArchived) {
            experimentList = experimentList.filter(item => item.status !== "archived");
        }

        //TODO: Need to get into the feature Dictionary and loop through it while pulling out just the Id of the feature in the key to look into the data of teh Experiments
        for (var i = 0; i < experimentList.length; i++) {

            //NOTE: Parse the Experiment JSON object that is first in the array of JSON objects. 
            var parsedExperiment = JSON.parse(JSON.stringify(experimentList[i]));

            //NOTE: Pull specific fields to create a dictionary of experiment data
            var featureName = parsedExperiment["feature_name"];

            //NOTE: If there is no feature attached to an experiment, then skip experiment.
            if (featureName === undefined) {
                continue;
            }

            var experimentName = parsedExperiment["name"];

            //NOTE: These fields are pulled to help create the key for the dictionary.
            //var featureId = parsedExperiment["feature_id"];
            var experimentEnvironments = parsedExperiment["environments"];

            //NOTE: Get arrary of Keys for environment so that we can get a count to loop through. 
            let environmentKeys = Object.keys(JSON.parse(JSON.stringify(experimentEnvironments)));

            //NOTE: Loop through the array of envionment keys.
            for (var j = 0; j < environmentKeys.length; j++) {

                //NOTE: Key to be used for getting specific environment data in objects.
                let environmentName = environmentKeys[j];

                //NOTE: Use the environment name to pull the specific environment.
                let environment = JSON.parse(JSON.stringify(experimentEnvironments[environmentName]));

                //NOTE: Status is a main field for the return data
                var status = environment["status"];

                //NOTE: Build the Dictionary for Experiments
                experimentsDictionary[featureName + '_' + environmentName] = [experimentName, featureName, environmentName, status];

            }
        }
        return experimentsDictionary;
    }
    catch (error) {

        console.log(error);
    }
}


//NOTE: This function is creating the return object of Flags that are in Use and Flags that are not in Use.
async function FlagUsageReporting(featureDictionary, experimentDictionary, audiencesList) {
    try {

        //NOTE: Array to place the running and nonrunning experiment/feature data in.
        let flagUsageReport = [];

        //NOTE: Variables to be filled with data of running and nonrunning experiment/feature information.
        var experimentString = "";
        var experimentArray = [];

        var featureString = "";
        var featureArray = [];

        var orphanFeature = "";
        var orphanFeatureArray = [];

        //NOTE: For every key in the feature dictionary
        for (var key in featureDictionary) {

            //NOTE: Is the key from the feature dictionary in the keys for the experiment dictionary
            if (key in experimentDictionary) {

                //NOTE: The Feature is in an Experiment. We need to then pull the experiment data from the dictionary to look to see if it is running.
                var experimentData = experimentDictionary[key];

                var status = experimentData[3];
                var featureName = experimentData[1];

                //NOTE: Gathered the experiment data
                var experimentName = experimentData[0];
                var environmentName = experimentData[2];

                //NOTE: Gather the feature data
                var featureData = featureDictionary[key];

                //NOTE: Loop through the Rollout_Rules
                for (var i = 0; i < featureData.length; i++) {

                    //NOTE: Parse the rollout_rules data
                    var parsedRollout = JSON.parse(JSON.stringify(featureData[i]));

                    var rolloutAudience = parsedRollout["audience_conditions"];
                    var enabledStatus = parsedRollout["enabled"];

                    var rolloutAudienceConditions = [];

                    //NOTE: If the Condition is anything other than everyone then go into working through the condiction else it will just use the audience of everyone.
                    if (rolloutAudience !== 'everyone') {

                        //NOTE: calling the function ProcessAudiences to go through a json string and find the Audience Ids.
                        var rolloutIds = await ProcessAudiences(rolloutAudience);

                        //NOTE:// Loop through the rollout ids.
                        for (var j = 0; j < rolloutIds.length; j++) {

                            //NOTE: Use Filter to pull data for a specific Audience ID
                            var audienceData = audiencesList.filter(item => item.id === rolloutIds[j]);

                            //NOTE: Loop through audience conditions
                            for (var k = 0; k < audienceData.length; k++) {

                                var parsedAudience = JSON.parse(JSON.stringify(audienceData[k]));

                                //NOTE: Pull the name of the audience condition
                                var audienceConditionName = parsedAudience["name"];

                                rolloutAudienceConditions.push(audienceConditionName);
                            }
                        }
                    }

                    //NOTE: This is the record for the experiments to go into arrays
                    experimentString = `${experimentName},${featureName},${environmentName},${status}`;
                    //NOTE: If there is a rolloutAudienceCondition with a length not 0 then the condition is something other than 'everyone' and it uses that condition name
                    featureString = `${featureName},${environmentName},'${rolloutAudienceConditions.length !== 0 ? rolloutAudienceConditions : rolloutAudience}',${enabledStatus}`;

                    //NOTE: Push the CSV strings into the specific arrays.
                    featureArray.push(featureString);
                    experimentArray.push(experimentString);
                }
            }
            else {

                //TODO: Create an array of Features that are not in an experiment.
                var featureData = featureDictionary[key];
                //NOTE: This is pull everything before the last _ character to get the feature name from the dictionary key.
                var featureName = key.slice(0, key.lastIndexOf('_'));

                //NOTE: This is getting the features environment from the dictionary key.
                var index = key.lastIndexOf('_');
                var featureEnvironment = key.substring(index + 1);

                //NOTE: Loop through each feature rollout rule
                for (var i = 0; i < featureData.length; i++) {

                    //NOTE: Parse the rollout_rules data
                    var parsedRolloutRule = JSON.parse(JSON.stringify(featureData[i]));

                    //NOTE: Pull the audience conditions out of the rollout_rules
                    var rolloutAudience = parsedRolloutRule["audience_conditions"];
                    var rolloutAudienceConditions = [];

                    //NOTE: If the Condition is anything other than everyone then go into working through the condiction else it will just use the audience of everyone.
                    if (rolloutAudience !== 'everyone') {

                        //NOTE: calling the function ProcessAudiences to go through a json string and find the Audience Ids.
                        var rolloutIds = await ProcessAudiences(rolloutAudience);

                        //NOTE:// Loop through the rollout ids.
                        for (var j = 0; j < rolloutIds.length; j++) {

                            //NOTE: Use Filter to pull data for a specific Audience ID
                            var audienceData = audiencesList.filter(item => item.id === rolloutIds[j]);

                            //NOTE: Loop through audience conditions
                            for (var k = 0; k < audienceData.length; k++) {

                                var parsedAudience = JSON.parse(JSON.stringify(audienceData[k]));

                                //NOTE: Pull the name of the audience condition
                                var audienceConditionName = parsedAudience["name"];

                                rolloutAudienceConditions.push(audienceConditionName);
                            }
                        }
                    }

                    //NOTE: Pull the enabled field in the Rollout Rule object. 
                    var enabledStatus = parsedRolloutRule["enabled"];

                    //NOTE: CSV object for orphaned features that are not attached to anything. Will be pushed into array
                    //NOTE: If there is a rolloutAudienceCondition with a length not 0 then the condition is something other than 'everyone' and it uses that condition name
                    orphanFeature = `${featureName},${featureEnvironment},'${rolloutAudienceConditions.length !== 0 ? rolloutAudienceConditions : rolloutAudience}',${enabledStatus}`;

                    //NOTE: Push the CSV strings into the specific arrays.
                    orphanFeatureArray.push(orphanFeature);

                }
            }
        }

        //NOTE: Build the object of arrays to return from the Flag Usage Reporting function.
        flagUsageReport = { experimentArray, featureArray, orphanFeatureArray };

        return flagUsageReport;
    }
    catch (error) {
        console.log(error);
    }
}

//NOTE: Function to pull all of the audiences per Project Id and filter out Archived audieces of required.
async function PullAudiences(includeArchived) {
    try {

        //NOTE: Calling the RestAPI to gather a list of all of the audiences per projectId
        let audienceList = await restAPI.audiences('list');

        //NOTE: This is saying if the variable of includeArchived is false then it will filter them out of the restAPI Return object
        if (!includeArchived) {
            audienceList = audienceList.filter(item => item.archived !== true);
        }
        return audienceList;
    }
    catch (error) {
        console.log(error);
    }

};

//NOTE: Function to pull the audience condition(s) Id from the Rollout Rule
async function ProcessAudiences(conditions) {
    try {
        let conditionArray = [];
        let audienceConditions = JSON.parse(conditions);

        const audienceIds = audienceConditions.filter(audience => Object.keys(audience).includes("audience_id"));

        for (let i = 0; i < audienceIds.length; i++) {

            var audienceCondition = audienceIds[i].audience_id
            conditionArray.push(audienceCondition);
        }

        return conditionArray;
    }
    catch (error) {
        console.log(error);
    }
};
