# Realtor_FlagUsageReport
 Flag Usage Report for Experiments and Features


 Description:

 This is a function that will call the Optimizely REST API to pull a list of Features, Experiments, and Audiences. It will filter out the Archived Features, Experiments, and Audiences by default unless told otherwise. The Function will then go through all of the Features, creating a dictionary with the data gathered for the individual features. It will do the same thing for the Experiments. Then the process will compare the dictionary keys, if the key for the features is in the key for the experiment it will then gather the data for each and place them in their particular array. If the key for the feature does not match anything in the dictionary key for the experiment than that means the feature is not attached to any experiment. The process will then gather the data for that particular feature and place that information into the Orphan Feature Array. Once the process is finished with all of the data reporting, will then put the 3 different arrays of csv strings into a data object and return it to the calling process. 


 NOTES:

   1. NODE MODULES
      * Axios
      * data-uri-to-buffer
      * fetch-blob
      * follow-redirects
      * formdata-polyfill
      * node-domexception
      * node-fetch
      * web-streams-polyfill

   2. API Endpoints
      * audiences
      * experiments
      * features
   
   3. Utilities
      * config
      * http-tools
      * optly-rest-toolkit

   4. Main
      * FlagUsageReport.js

   5. Function 
      * OptimizelyUsageReport(personalToken, personalProject, includeArchived = false)
      * Function Call example: var test = await OptimizelyUsageReport("2:y6zgm6n90281Ni2SgztOYi9272MiFcze2N4XYRqdJ9sgyjimwi", 15615615166, true);

      Parameters:
         1. personalToken - This is a RESTAPI bearer token. 
            *You can get the bearer token for RESTAPI Access, by following these instructions:
             * Access your developer account at app.optimizely.com. Once logged in, the dashboard is displayed.
             * Click Profile on the bottom left hand corner of the navigation tree.
             * Select the API Access tab.
             * Click Generate New Token.
             * Enter a name for the new token on the popup and click Create. The website will redirect to the dashboard.
             * Copy the token value from the Token column on the dashboard.
         
         2. personalProject - Project ID that you are wanting to report usage of experiments and features on.
            *You can get the Project ID of a Project by following these instructions:
             * Access your developer account at app.optimizely.com. Once logged in, the dashboard is displayed.
             * Click the Projects menu on the left menu, and select your project
             * Then click the Experiments menu on the left, and all of the experiments will show up on the main display. 
             * Click on an Experiment name, and a new menu will be displayed on the left hand side. 
             * Click the menu named:  API Names
             * After clicking that there will be information that will be displayed, and you should find the section: Experiment Details.
             * Copy the field named Project ID.

         3. includeArchive - This parameter is defaulted to False, which means it will filter out all of the archived Audiences, Experiments, and Features from the report. If you want that data, then you can pass (true) to the function call. 

      
    6. Return Data:
      * Data Object Returned: {experimentArray: Array(), featureArray: Array(), orphanFeatureArray: Array()}
      * Experiment Array:
         * CSV String Fields: ExperimentName,FeatureName,EnvironmentName},Status
         * Example: ['Feature_Experiment,Test_Feature,development,not_started']
      
      * Feature Array:
         * CSV String Fields: FeatureName,FeatureEnvironment,RolloutAudienceConditions,EnabledStatus
         * Example: ['Test_Feature,development,'peeps',true']
      
      * Orphan Feature Array:
         * CSV String Fields: FeatureName,FeatureEnvironment,RolloutAudienceConditions,EnabledStatus
         * Example: ['size,development,'everyone',true']