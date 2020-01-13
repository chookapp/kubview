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
        res.sendFile(path.join(__dirname, '../public/testdata', 'pod.json'));
    }
    funcs.pvcFunction = async (res) => {
        res.sendFile(path.join(__dirname, '../public/testdata', 'pvc.json'));
    }
    funcs.pvFunction = async (res) => {
        res.sendFile(path.join(__dirname, '../public/testdata', 'pv.json'));
    }
    funcs.statefulsetFunction = async (res) => {
        res.sendFile(path.join(__dirname, '../public/testdata', 'statefulset.json'));
    }
    
}


app.get('/k8s/pod.json', async (req, res) => await funcs.podFunction(res))
app.get('/k8s/pvc.json', async (req, res) => await funcs.pvcFunction(res))
app.get('/k8s/pv.json', async (req, res) => await funcs.pvFunction(res))
app.get('/k8s/statefulset.json', async (req, res) => await funcs.statefulsetFunction(res))

app.listen(4000)
