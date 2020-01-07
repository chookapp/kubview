const axios = require('axios');

class k8sproxy {

    listPodForAllNamespaces() {
        return axios.get('../testdata/pod.json').then((response) => {
            return(response.data);
        }).catch(function (error) {
            console.log(error);
        })
    }

    listPersistentVolumeClaimForAllNamespaces() {
        return axios.get('../testdata/pvc.json').then((response) => {
            return(response.data);
        }).catch(function (error) {
            console.log(error);
        })
    }

    listPersistentVolumeForAllNamespaces() {
        return axios.get('../testdata/pv.json').then((response) => {
            return(response.data);
        }).catch(function (error) {
            console.log(error);
        })
    }

    listStatefulSetForAllNamespaces() {
        return axios.get('../testdata/statefulset.json').then((response) => {
            return(response.data);
        }).catch(function (error) {
            console.log(error);
        })
    }

}



export default k8sproxy;