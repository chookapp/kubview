const axios = require('axios');

class k8sproxy {

    listPodForAllNamespaces() {
        return axios.get('/k8s/pod.json').then((response) => {
            return(response.data);
        }).catch(function (error) {
            console.log(error);
        })
    }

    listPersistentVolumeClaimForAllNamespaces() {
        return axios.get('/k8s/pvc.json').then((response) => {
            return(response.data);
        }).catch(function (error) {
            console.log(error);
        })
    }

    listPersistentVolumeForAllNamespaces() {
        return axios.get('/k8s/pv.json').then((response) => {
            return(response.data);
        }).catch(function (error) {
            console.log(error);
        })
    }

    listStatefulSetForAllNamespaces() {
        return axios.get('/k8s/statefulset.json').then((response) => {
            return(response.data);
        }).catch(function (error) {
            console.log(error);
        })
    }

}



export default k8sproxy;