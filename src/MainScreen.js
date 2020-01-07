import React from 'react';
import k8sproxy from './k8sproxy_mock.js';

import "./style.css"

function ItemStatus(props) {
    let color = "black"
    const status = props.item.status
    if(status === "Running")
        color = "green"    
    return (
    <div style={{display: "inline-block", width: "100px", float: "right", color: color}}>{status}</div>
    );
}

function ItemName(props) {
    return (
    <div style={{display: "inline-block", width: "300px"}}>{props.item.name}</div>
    );
}

function ItemKind(props) {
    return (
    <div style={{display: "inline-block", width: "100px", float: "left"}}><i>{props.item.kind}</i></div>
    );
}


function Pvc(props) {
    const pvc = props.pvc;
    
    return (
    <div> 
        <ItemKind item={pvc}/> <ItemName item={pvc}/> <ItemStatus item={pvc}/>
        <Pv pv={pvc.pv}/>
    </div>
    );
}


function Pv(props) {
    const pv = props.pv;
    
    return (
    <div> 
        <ItemKind item={pv}/> <ItemName item={pv}/> <ItemStatus item={pv}/>
    </div>
    );
}


function Pod(props) {
    const pod = props.pod;
    
    return (
    <div> 
        <ItemKind item={pod}/> <ItemName item={pod}/> <ItemStatus item={pod}/>
        <ul>
            {pod.pvcs.map((pvc) => <li key={pvc.id}><Pvc pvc={pvc}/></li>)} 
            {pod.pvcNames.map((pvc) => <li key={pvc.name}>{pvc}</li>)} 
        </ul>
    </div>
    );
}


function StatefullSet(props) {
    const ss = props.ss;
    const pods = ss.pods.map((pod) =>
    <li key={pod.id}><Pod pod={pod}/></li>
    );
    return (
      <div> <ItemKind item={ss}/> <ItemName item={ss}/> <ItemStatus item={ss}/>
      <ul>{pods}</ul>
      </div>
    );
}

class MainScreen extends React.Component {

    constructor(props) {
        super(props);     

        this.state =
        {
            data:
            {
                pods: [],
                nodes: [],
                namespaces: [],
                pvs: [],
                pvcs: [],
                statefullsetes: [],
                deployments: [],
            }
        }

//        this.calcNewState = this.calcNewState.bind(this);
    }

    componentDidMount() {
        const k8p = new k8sproxy();
        let promises = [];
        let myData = {};

        promises.push(k8p.listPodForAllNamespaces().then((data) => { myData.pods = this.createItems(data) }));
        promises.push(k8p.listPersistentVolumeClaimForAllNamespaces().then((data) => { myData.pvcs = this.createItems(data) }));
        promises.push(k8p.listPersistentVolumeForAllNamespaces().then((data) => { myData.pvs = this.createItems(data) }));
        promises.push(k8p.listStatefulSetForAllNamespaces().then((data) => { myData.statefullsetes = this.createItems(data) }));

        Promise.all(promises).then(() => { this.setState({data: myData}); });
    }

    createItems(data) {
        let ret = []
        for (let item of data.items) {
            let newItem = {}
            newItem.kind = item.kind
            newItem.name = item.metadata.name
            newItem.namespace = item.metadata.namespace
            newItem.id = item.metadata.uid
            newItem.status = item.status.phase

            if (newItem.kind === "StatefulSet") {                                
                newItem.status = item.status.readyReplicas + "/" + item.status.replicas
            }

            if (newItem.kind === "Pod") {
                newItem.node = item.spec.nodeName
                newItem.ownerIds = item.metadata.ownerReferences.map((or) => or.uid)
                newItem.pvcNames = []
                newItem.pvcs = []
                for (let vol of item.spec.volumes) {
                    if ("persistentVolumeClaim" in vol) {
                        newItem.pvcNames.push(vol.persistentVolumeClaim.claimName)
                    }
                }
            }

            if (newItem.kind === "PersistentVolumeClaim") {
                // newItem.size = item.spec.resources.requests.storage
                newItem.pv = item.spec.volumeName
                newItem.kind = "PVC"
            }

            if (newItem.kind === "PersistentVolume") {
                newItem.size = item.spec.capacity.storage
                newItem.kind = "PersistentVol"
            }   
            ret.push(newItem)
        }
        return ret
    }

    getChildPods(id, pods) {
        let ret = [];
        let remains = [];
        for(let pod of pods) {
            if(pod.ownerIds.indexOf(id) !== -1)
                ret.push(pod)
            else
                remains.push(pod)
        }  

        return [ret, remains];
    }

    extractPvcs(pod, pvcs) {
        let remains = [];

        for(let pvc of pvcs) {
            const idx = pod.pvcNames.indexOf(pvc.name)
            if(idx === -1)
            {
                remains.push(pvc)
            }
            else
            {
                pod.pvcs.push(pvc);
                pod.pvcNames.splice(idx, 1);
            }
        }

        return remains;
    }


    extractPvs(pvc, pvs) {
        let remains = [];

        for(let pv of pvs) {
            if(pvc.pv === pv.name)
            {
                remains.push(pv)
            }
            else
            {
                pvc.pv = pv
            }
        }

        return remains;
    }

    render() {

        let pvs = this.state.data.pvs;
        let pvcs = this.state.data.pvcs;
        let pods = this.state.data.pods;
        let statefullsetes = this.state.data.statefullsetes;

        for(let pvc of pvcs) {
            pvs = this.extractPvs(pvc, pvs)
        }

        for(let pod of pods) {
            pvcs = this.extractPvcs(pod, pvcs)
        }
        
        for(let ss of statefullsetes) {
            const [children, remains] = this.getChildPods(ss.id, pods);
            pods = remains
            ss.pods = children
        }

        return(
            <div style={{display: "inline-block", width: "600px"}}>

            Stateful sets:
            <ul>{statefullsetes.map((ss) => <li key={ss.id}><StatefullSet ss={ss}/></li>)}</ul>

            Unattached pods:
            <ul>{pods.map((pod) => <li key={pod.id}><Pod pod={pod}/></li>)}</ul>

            Unattached PVCs:
            <ul>{pvcs.map((pvc) => <li key={pvc.id}><Pvc pvc={pvc}/></li>)}</ul>

            Unattached persistant volumes:
            <ul>{pvs.map((pv) => <li key={pv.id}><Pv pv={pv}/></li>)}</ul>
            </div>

            
        );
    }
}

export default MainScreen;