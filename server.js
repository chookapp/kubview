const express = require('express');
const path = require('path')
const k8s = require('@kubernetes/client-node');

const app = express();


let funcs = {}

async function generic_k8s(res, func) {
    try
        {
            const r = await func();        
            res.send(r.body);
        }
        catch(error)
        {
            res.send({items: []})
            console.log(error)
        }
}

if (("KUBERNETES" in process.env) && (process.env.KUBERNETES === "1")) {
    console.log('KUBERNETES is set!');
    
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
    
    funcs.podFunction =  async (res) => generic_k8s(res, () => k8sApi.listPodForAllNamespaces())
    funcs.pvcFunction =  async (res) => generic_k8s(res, () => k8sApi.listPersistentVolumeClaimForAllNamespaces())
    funcs.pvFunction =  async (res) => generic_k8s(res, () => k8sApi.listPersistentVolume())
    funcs.statefulsetFunction =  async (res) => generic_k8s(res, () => k8sAppsApi.listStatefulSetForAllNamespaces())
    funcs.deplymentsFunction =  async (res) => generic_k8s(res, () => k8sAppsApi.listDeploymentForAllNamespaces())
    funcs.replicasetsFunction =  async (res) => generic_k8s(res, () => k8sAppsApi.listReplicaSetForAllNamespaces())

    // funcs.podFunction = async (res) => {
    //     try
    //     {
    //         const r = await k8sApi.listPodForAllNamespaces();        
    //         res.send(r.body);
    //     }
    //     catch(error)
    //     {
    //         res.send({items: []})
    //         console.log(error)
    //     }
    // }
    
} else {

    console.log('KUBERNETES not set!');

    funcs.podFunction = async (res) => {
        res.sendFile(path.join(__dirname, 'public/testdata2', 'pod.json'));
    }
    funcs.pvcFunction = async (res) => {
        res.sendFile(path.join(__dirname, 'public/testdata2', 'pvc.json'));
    }
    funcs.pvFunction = async (res) => {
        res.sendFile(path.join(__dirname, 'public/testdata2', 'pv.json'));
    }
    funcs.statefulsetFunction = async (res) => {
        res.sendFile(path.join(__dirname, 'public/testdata2', 'statefulset.json'));
    }
    funcs.deplymentsFunction = async (res) => {
        res.sendFile(path.join(__dirname, 'public/testdata2', 'deployment.json'));
    }
    funcs.replicasetsFunction = async (res) => {
        res.sendFile(path.join(__dirname, 'public/testdata2', 'replicaset.json'));
    }
    
}


app.get('/k8s/pod.json', async (req, res) => await funcs.podFunction(res))
app.get('/k8s/pvc.json', async (req, res) => await funcs.pvcFunction(res))
app.get('/k8s/pv.json', async (req, res) => await funcs.pvFunction(res))
app.get('/k8s/statefulset.json', async (req, res) => await funcs.statefulsetFunction(res))
app.get('/k8s/deployment.json', async (req, res) => await funcs.deplymentsFunction(res))
app.get('/k8s/replicaset.json', async (req, res) => await funcs.replicasetsFunction(res))

app.use(express.static(path.join(__dirname, 'build')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
  })

app.listen(4000)
