const axios = require('axios');

class k8sproxy {

    listPodForAllNamespaces() {
            return axios.get('../testdata/pod.json').then((response) => {
                return(response.data);
            }).catch(function (error) {
                console.log(error);
            })
        }


    }



export default k8sproxy;