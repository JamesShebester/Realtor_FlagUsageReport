import config from "../utils/config.js";

//Optimizely Rest API V2
//https://library.optimizely.com/docs/api/app/v2/index.html

const section = "experiments";

const experiments_api = {
    experiments: {
        list: (options = {}) => {
            if (!options.projectId) {
                throw new Error("A project ID is required to list all experiments.");
            }
            return {
                method: "GET",
                // prettier-ignore
                resource: `${config.apiURL_V2}/${section}?project_id=${options?.projectId ? options.projectId : 0}&page=${options?.linkPageIndex ? options.linkPageIndex : 1}&per_page=${options?.perPage ? options.perPage : 100}`,
                params: {},
                body: null,
            };
        }
    }
};

export default experiments_api;
