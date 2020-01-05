const k8s = require('@kubernetes/client-node');

class k8sproxy {

        constructor() {
            
            const kc = new k8s.KubeConfig();
            kc.loadFromDefault();

            this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        }

        listPodForAllNamespaces() {
            this.k8sApi.listPodForAllNamespaces().then((res) => {
                return res.body;
            });
        }
    }


export default k8sproxy;