const axios = require('axios');

class k8sproxy {

        listNamespacedPod(ns) {
            return axios.get('../testdata/pod.json').then((response) => {
                return(response.data);
            }).catch(function (error) {
                console.log(error);
            })
        }


    }



export default k8sproxy;